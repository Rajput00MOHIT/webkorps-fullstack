import { db } from '../../db/client.js';
import { AuditLogger } from '../audit/auditLogger.js';
import createHttpError from 'http-errors';
import { ContentGenerationProviderFactory } from './contentGenerationProvider.js';
import { ContentValidationService } from './contentValidationService.js';
import type { ContentDraft } from './contentTypes.js';

export interface GenerateDraftOptions {
  organizationId: string;
  projectId: string;
  providerName?: string;
  allowLocalTemplateFallback?: boolean;
  format?: string;
}

export class ContentDraftService {
  /**
   * Generates a grounded content draft strictly guided by the content brief and KG entities.
   * Increments draft version and initiates automated validation.
   */
  public static async generateDraft(options: GenerateDraftOptions): Promise<ContentDraft> {
    const { organizationId, projectId, providerName = 'openai', allowLocalTemplateFallback = false, format = 'MARKDOWN' } = options;

    // 1. Verify Project
    const projectRes = await db.query(
      `SELECT * FROM content_projects WHERE id = $1 AND organization_id = $2`,
      [projectId, organizationId]
    );

    if (projectRes.rows.length === 0) {
      throw createHttpError(404, 'Content project not found.');
    }
    const project = projectRes.rows[0];

    // 2. Load Brief
    const briefRes = await db.query(
      `SELECT * FROM content_briefs WHERE content_project_id = $1 AND organization_id = $2 ORDER BY created_at DESC LIMIT 1`,
      [projectId, organizationId]
    );

    if (briefRes.rows.length === 0) {
      throw createHttpError(400, 'Content brief must be generated before drafting.');
    }
    const brief = briefRes.rows[0];

    // Update Project Status to GENERATING
    await db.query(
      `UPDATE content_projects SET status = 'GENERATING', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND organization_id = $2`,
      [projectId, organizationId]
    );

    // 3. Load KG Company Context (Ground Truth)
    const entityRes = await db.query(
      `SELECT name, entity_type, attributes FROM knowledge_entities WHERE organization_id = $1`,
      [organizationId]
    );

    const orgEntity = entityRes.rows.find(e => e.entity_type === 'COMPANY' || e.entity_type === 'ORGANIZATION') || entityRes.rows[0];
    const companyName = orgEntity ? orgEntity.name : 'Webkorps';
    const services = entityRes.rows
      .filter(e => e.entity_type === 'SERVICE')
      .map(e => e.name);

    if (services.length === 0) {
      services.push('AI & ML Engineering', 'Cloud Solutions', 'Enterprise Software Architecture');
    }

    // 4. Delegate to Content Generation Provider
    const provider = ContentGenerationProviderFactory.getProvider(providerName);
    const genResponse = await provider.generateDraft({
      brief,
      companyName,
      services,
      allowLocalTemplateFallback
    });

    // 5. Versioning: Compute next version
    const verRes = await db.query(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next_ver FROM content_drafts WHERE content_project_id = $1 AND organization_id = $2`,
      [projectId, organizationId]
    );
    const nextVersion = verRes.rows[0].next_ver;

    const metaTitle = `${project.title} | ${companyName}`;
    const metaDescription = `Authoritative guide to ${project.target_keyword} by ${companyName}. Explore enterprise architectural patterns and verified technical solutions.`;

    // 6. Insert new draft
    const insertRes = await db.query(
      `INSERT INTO content_drafts (
        organization_id, content_project_id, version, title, body_markdown,
        meta_title, meta_description, format, generation_provider, generation_model,
        raw_response, token_usage, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'VALIDATING')
      RETURNING *`,
      [
        organizationId,
        projectId,
        nextVersion,
        project.title,
        genResponse.bodyMarkdown,
        metaTitle,
        metaDescription,
        format,
        genResponse.provider,
        genResponse.model,
        genResponse.rawResponse,
        JSON.stringify(genResponse.tokenUsage || {}),
      ]
    );

    const createdDraft = insertRes.rows[0];

    // 7. Execute automated validation pipeline (Fact Check, SEO, GEO, Duplicate)
    await ContentValidationService.runAllValidations(organizationId, createdDraft.id);

    // Refresh draft status after validations
    const finalDraftRes = await db.query(
      `SELECT * FROM content_drafts WHERE id = $1 AND organization_id = $2`,
      [createdDraft.id, organizationId]
    );

    const finalDraft = finalDraftRes.rows[0];

    // Audit Log
    await AuditLogger.log({
      organizationId,
      action: 'GENERATE_CONTENT_DRAFT',
      entityType: 'CONTENT_DRAFT',
      entityId: finalDraft.id,
      details: {
        projectId,
        version: nextVersion,
        provider: genResponse.provider,
        model: genResponse.model
      }
    });

    return finalDraft;
  }

  public static async getDrafts(organizationId: string, projectId?: string): Promise<ContentDraft[]> {
    let sql = `SELECT * FROM content_drafts WHERE organization_id = $1`;
    const params: any[] = [organizationId];

    if (projectId) {
      sql += ` AND content_project_id = $2 ORDER BY version DESC`;
      params.push(projectId);
    } else {
      sql += ` ORDER BY created_at DESC`;
    }

    const res = await db.query(sql, params);
    return res.rows;
  }

  public static async getDraftById(organizationId: string, draftId: string): Promise<ContentDraft> {
    const res = await db.query(
      `SELECT * FROM content_drafts WHERE id = $1 AND organization_id = $2`,
      [draftId, organizationId]
    );

    if (res.rows.length === 0) {
      throw createHttpError(404, 'Content draft not found.');
    }

    return res.rows[0];
  }

  public static async updateDraft(
    organizationId: string,
    draftId: string,
    updates: { title?: string; bodyMarkdown?: string; metaTitle?: string; metaDescription?: string }
  ): Promise<ContentDraft> {
    const current = await this.getDraftById(organizationId, draftId);

    const title = updates.title ?? current.title;
    const body = updates.bodyMarkdown ?? current.body_markdown;
    const metaTitle = updates.metaTitle ?? current.meta_title;
    const metaDescription = updates.metaDescription ?? current.meta_description;

    const res = await db.query(
      `UPDATE content_drafts
       SET title = $1, body_markdown = $2, meta_title = $3, meta_description = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND organization_id = $6
       RETURNING *`,
      [title, body, metaTitle, metaDescription, draftId, organizationId]
    );

    // Re-run validation on updated body
    await ContentValidationService.runAllValidations(organizationId, draftId);

    return res.rows[0];
  }
}
