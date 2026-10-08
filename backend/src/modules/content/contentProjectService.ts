import { db } from '../../db/client.js';
import { AuditLogger } from '../audit/auditLogger.js';
import createHttpError from 'http-errors';
import type { ContentProject, ContentType, ContentStatus, SearchIntent } from './contentTypes.js';

export interface CreateContentProjectInput {
  organizationId: string;
  websiteId?: string;
  opportunityId?: string;
  title: string;
  topic?: string;
  contentType?: ContentType;
  targetKeyword: string;
  searchIntent?: SearchIntent;
  audience?: string;
  language?: string;
  metadata?: Record<string, any>;
}

export class ContentProjectService {
  /**
   * Creates a tenant-isolated content project, optionally deriving context from a Phase 5 opportunity.
   */
  public static async createProject(input: CreateContentProjectInput): Promise<ContentProject> {
    if (!input.title || !input.title.trim()) {
      throw createHttpError(400, 'Project title is required.');
    }
    if (!input.targetKeyword || !input.targetKeyword.trim()) {
      throw createHttpError(400, 'Target keyword is required.');
    }

    let derivedTopic = input.topic;
    let derivedIntent = input.searchIntent || 'INFORMATIONAL';
    let originatingOpp: any = null;

    // 1. Consume Phase 5 Opportunity if provided
    if (input.opportunityId) {
      const oppRes = await db.query(
        `SELECT * FROM opportunities WHERE id = $1 AND organization_id = $2`,
        [input.opportunityId, input.organizationId]
      );
      if (oppRes.rows.length > 0) {
        originatingOpp = oppRes.rows[0];
        if (!derivedTopic) {
          derivedTopic = originatingOpp.title;
        }
        // Infer intent from query/type
        const q = (originatingOpp.query || originatingOpp.title || '').toLowerCase();
        if (q.includes('best') || q.includes('top') || q.includes('compare')) {
          derivedIntent = 'COMPARISON';
        } else if (q.includes('service') || q.includes('company') || q.includes('agency') || q.includes('pricing')) {
          derivedIntent = 'COMMERCIAL';
        }
      }
    }

    // 2. Duplicate Content & Keyword Cannibalization Check
    const existingSameKeyword = await db.query(
      `SELECT id, title, status FROM content_projects 
       WHERE organization_id = $1 AND target_keyword ILIKE $2 AND status != 'REJECTED' AND status != 'ARCHIVED'`,
      [input.organizationId, input.targetKeyword.trim()]
    );
    const hasExistingProject = existingSameKeyword.rows.length > 0;

    const res = await db.query(
      `INSERT INTO content_projects 
       (organization_id, website_id, opportunity_id, title, topic, content_type, target_keyword, search_intent, audience, language, status, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'IDEA', $11)
       RETURNING *`,
      [
        input.organizationId,
        input.websiteId || null,
        input.opportunityId || null,
        input.title.trim(),
        derivedTopic || input.title.trim(),
        input.contentType || 'BLOG',
        input.targetKeyword.trim(),
        derivedIntent,
        input.audience || 'B2B Enterprise Decision Makers',
        input.language || 'en',
        JSON.stringify({
          ...(input.metadata || {}),
          cannibalizationWarning: hasExistingProject ? `Active project already targets keyword '${input.targetKeyword}'` : undefined
        })
      ]
    );

    const project = res.rows[0];

    await AuditLogger.log({
      organizationId: input.organizationId,
      action: 'CONTENT_PROJECT_CREATED',
      entityType: 'CONTENT_PROJECT',
      entityId: project.id,
      details: { title: project.title, keyword: project.target_keyword, opportunityId: input.opportunityId }
    });

    return project;
  }

  public static async getProjects(
    organizationId: string,
    filters: { status?: ContentStatus; contentType?: ContentType; searchIntent?: SearchIntent } = {}
  ): Promise<ContentProject[]> {
    let sql = `SELECT * FROM content_projects WHERE organization_id = $1`;
    const params: any[] = [organizationId];

    if (filters.status) {
      params.push(filters.status);
      sql += ` AND status = $${params.length}`;
    }
    if (filters.contentType) {
      params.push(filters.contentType);
      sql += ` AND content_type = $${params.length}`;
    }
    if (filters.searchIntent) {
      params.push(filters.searchIntent);
      sql += ` AND search_intent = $${params.length}`;
    }

    sql += ` ORDER BY created_at DESC`;
    const res = await db.query(sql, params);
    return res.rows;
  }

  public static async getProjectById(organizationId: string, projectId: string): Promise<ContentProject> {
    const res = await db.query(
      `SELECT * FROM content_projects WHERE id = $1 AND organization_id = $2`,
      [projectId, organizationId]
    );
    if (res.rows.length === 0) {
      throw createHttpError(404, 'Content project not found or access denied.');
    }
    return res.rows[0];
  }

  public static async updateProject(
    organizationId: string,
    projectId: string,
    updates: Partial<CreateContentProjectInput & { status: ContentStatus }>
  ): Promise<ContentProject> {
    await this.getProjectById(organizationId, projectId);

    const res = await db.query(
      `UPDATE content_projects 
       SET title = COALESCE($1, title),
           topic = COALESCE($2, topic),
           content_type = COALESCE($3, content_type),
           target_keyword = COALESCE($4, target_keyword),
           search_intent = COALESCE($5, search_intent),
           audience = COALESCE($6, audience),
           status = COALESCE($7, status),
           metadata = COALESCE($8, metadata),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 AND organization_id = $10
       RETURNING *`,
      [
        updates.title ?? null,
        updates.topic ?? null,
        updates.contentType ?? null,
        updates.targetKeyword ?? null,
        updates.searchIntent ?? null,
        updates.audience ?? null,
        updates.status ?? null,
        updates.metadata ? JSON.stringify(updates.metadata) : null,
        projectId,
        organizationId
      ]
    );

    await AuditLogger.log({
      organizationId,
      action: 'CONTENT_PROJECT_UPDATED',
      entityType: 'CONTENT_PROJECT',
      entityId: projectId,
      details: { updates }
    });

    return res.rows[0];
  }

  public static async deleteProject(organizationId: string, projectId: string): Promise<void> {
    await this.getProjectById(organizationId, projectId);
    await db.query(`DELETE FROM content_projects WHERE id = $1 AND organization_id = $2`, [projectId, organizationId]);
    await AuditLogger.log({
      organizationId,
      action: 'CONTENT_PROJECT_DELETED',
      entityType: 'CONTENT_PROJECT',
      entityId: projectId
    });
  }
}
