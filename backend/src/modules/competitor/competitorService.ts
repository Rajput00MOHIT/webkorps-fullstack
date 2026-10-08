import { db } from '../../db/client.js';
import { URLNormalizer } from '../crawler/urlNormalizer.js';
import { SSRFGuard } from '../crawler/ssrfGuard.js';
import { CrawlerService } from '../crawler/crawlerService.js';
import { AuditLogger } from '../audit/auditLogger.js';
import createHttpError from 'http-errors';
import type { Competitor, CompetitorStatus, CompetitorSourceType } from './competitorTypes.js';

export interface CreateCompetitorInput {
  organizationId: string;
  name: string;
  domain: string;
  url?: string;
  description?: string;
  coreCapabilities?: string[];
  source?: CompetitorSourceType;
  status?: CompetitorStatus;
  confidence?: number;
  evidenceSnippet?: string;
  queryOrPrompt?: string;
  metadata?: Record<string, any>;
}

export class CompetitorService {
  /**
   * Creates a tenant-isolated competitor with domain normalization and SSRF validation.
   * Handles duplicate domains idempotently.
   */
  public static async createCompetitor(input: CreateCompetitorInput): Promise<Competitor> {
    const rawDomain = (input.domain || '').trim().toLowerCase();
    if (!rawDomain) {
      throw createHttpError(400, 'Competitor domain is required.');
    }

    const domain = URLNormalizer.extractDomain(
      rawDomain.startsWith('http') ? rawDomain : `https://${rawDomain}`
    );

    // SSRF verification on competitor domain
    const testUrl = input.url || `https://${domain}`;
    const ssrfCheck = await SSRFGuard.validateUrl(testUrl, {
      allowLocal: process.env.ALLOW_LOCAL_CRAWL === 'true'
    });
    if (!ssrfCheck.safe) {
      throw createHttpError(400, `Competitor URL/domain failed safety validation: ${ssrfCheck.reason}`);
    }

    // Check existing competitor in same organization
    const existing = await db.query(
      `SELECT * FROM competitors WHERE organization_id = $1 AND domain = $2`,
      [input.organizationId, domain]
    );

    let compId: string;
    let competitorRecord: any;

    if (existing.rows.length > 0) {
      compId = existing.rows[0].id;
      // Merge capabilities and update metadata
      const existingCaps = existing.rows[0].core_capabilities || [];
      const newCaps = Array.from(new Set([...existingCaps, ...(input.coreCapabilities || [])]));
      
      const updateRes = await db.query(
        `UPDATE competitors 
         SET name = COALESCE($1, name),
             url = COALESCE($2, url),
             description = COALESCE($3, description),
             core_capabilities = $4,
             status = COALESCE($5, status),
             confidence = GREATEST(confidence, $6),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $7 AND organization_id = $8
         RETURNING *`,
        [
          input.name || existing.rows[0].name,
          input.url || existing.rows[0].url,
          input.description || existing.rows[0].description,
          newCaps,
          input.status || existing.rows[0].status,
          input.confidence ?? 1.0,
          compId,
          input.organizationId
        ]
      );
      competitorRecord = updateRes.rows[0];
    } else {
      const insertRes = await db.query(
        `INSERT INTO competitors 
         (organization_id, name, domain, url, description, core_capabilities, source, status, confidence, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          input.organizationId,
          input.name || domain,
          domain,
          input.url || `https://${domain}`,
          input.description || null,
          input.coreCapabilities || [],
          input.source || 'MANUAL',
          input.status || 'ACTIVE',
          input.confidence ?? 1.0,
          JSON.stringify(input.metadata || {})
        ]
      );
      competitorRecord = insertRes.rows[0];
      compId = competitorRecord.id;

      await AuditLogger.log({
        organizationId: input.organizationId,
        action: 'COMPETITOR_CREATED',
        entityType: 'COMPETITOR',
        entityId: compId,
        details: { competitorId: compId, name: input.name, domain, source: input.source || 'MANUAL' }
      });
    }

    // Attach provenance record if evidence or query is provided
    if (input.evidenceSnippet || input.queryOrPrompt || input.source) {
      await db.query(
        `INSERT INTO competitor_sources 
         (organization_id, competitor_id, source_type, query_or_prompt, evidence_snippet, confidence)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          input.organizationId,
          compId,
          input.source || 'MANUAL',
          input.queryOrPrompt || null,
          input.evidenceSnippet || null,
          input.confidence ?? 1.0
        ]
      );
    }

    return competitorRecord;
  }

  public static async getCompetitors(
    organizationId: string,
    filters: { status?: CompetitorStatus; search?: string } = {}
  ): Promise<Competitor[]> {
    let sql = `SELECT * FROM competitors WHERE organization_id = $1`;
    const params: any[] = [organizationId];

    if (filters.status) {
      params.push(filters.status);
      sql += ` AND status = $${params.length}`;
    }

    if (filters.search) {
      params.push(`%${filters.search}%`);
      sql += ` AND (name ILIKE $${params.length} OR domain ILIKE $${params.length})`;
    }

    sql += ` ORDER BY created_at DESC`;
    const res = await db.query(sql, params);
    return res.rows;
  }

  public static async getCompetitorById(organizationId: string, competitorId: string): Promise<Competitor> {
    const res = await db.query(
      `SELECT * FROM competitors WHERE id = $1 AND organization_id = $2`,
      [competitorId, organizationId]
    );
    if (res.rows.length === 0) {
      throw createHttpError(404, 'Competitor not found or access denied.');
    }
    return res.rows[0];
  }

  public static async updateCompetitor(
    organizationId: string,
    competitorId: string,
    data: Partial<CreateCompetitorInput>
  ): Promise<Competitor> {
    const comp = await this.getCompetitorById(organizationId, competitorId);

    const res = await db.query(
      `UPDATE competitors 
       SET name = COALESCE($1, name),
           url = COALESCE($2, url),
           description = COALESCE($3, description),
           core_capabilities = COALESCE($4, core_capabilities),
           status = COALESCE($5, status),
           confidence = COALESCE($6, confidence),
           metadata = COALESCE($7, metadata),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND organization_id = $9
       RETURNING *`,
      [
        data.name ?? null,
        data.url ?? null,
        data.description ?? null,
        data.coreCapabilities ?? null,
        data.status ?? null,
        data.confidence ?? null,
        data.metadata ? JSON.stringify(data.metadata) : null,
        competitorId,
        organizationId
      ]
    );

    await AuditLogger.log({
      organizationId,
      action: 'COMPETITOR_UPDATED',
      entityType: 'COMPETITOR',
      entityId: competitorId,
      details: { competitorId, updates: data }
    });

    return res.rows[0];
  }

  public static async deleteCompetitor(organizationId: string, competitorId: string): Promise<void> {
    await this.getCompetitorById(organizationId, competitorId);
    await db.query(`DELETE FROM competitors WHERE id = $1 AND organization_id = $2`, [competitorId, organizationId]);
    await AuditLogger.log({
      organizationId,
      action: 'COMPETITOR_DELETED',
      entityType: 'COMPETITOR',
      entityId: competitorId,
      details: { competitorId }
    });
  }

  /**
   * Queues a crawl for competitor domain using existing universal crawler.
   * Ensures pages are marked as external/untrusted knowledge.
   */
  public static async crawlCompetitor(
    organizationId: string,
    competitorId: string,
    options: { maxPages?: number; scope?: 'PAGE' | 'DIRECTORY' | 'DOMAIN' | 'SITEMAP'; renderJavascript?: boolean } = {}
  ) {
    const comp = await this.getCompetitorById(organizationId, competitorId);
    const targetUrl = comp.url || `https://${comp.domain}`;

    const crawlRun = await CrawlerService.queueCrawl({
      organizationId,
      targetUrl,
      scope: options.scope || 'DOMAIN',
      maxPages: options.maxPages || 30,
      respectRobots: true,
      followSitemaps: true,
      renderJavascript: options.renderJavascript ?? false
    });

    await AuditLogger.log({
      organizationId,
      action: 'COMPETITOR_CRAWL_QUEUED',
      entityType: 'COMPETITOR',
      entityId: competitorId,
      details: { competitorId, targetUrl, crawlRunId: crawlRun.crawlRunId }
    });

    return crawlRun;
  }
}
