import { db } from '../../db/client.js';
import { QueryRouter } from '../queryRouter/queryRouter.js';
import type { ResearchRoute } from '../queryRouter/queryRouter.js';
import { SearchProviderFactory } from './searchProvider.js';
import { RelevanceRanker } from './relevanceRanker.js';
import { SSRFGuard } from '../crawler/ssrfGuard.js';
import { HtmlExtractor } from '../crawler/htmlExtractor.js';
import { ResearchCache } from './researchCache.js';
import { KnowledgeService } from '../knowledge/knowledgeService.js';

export interface StartResearchInput {
  organizationId: string;
  userId?: string;
  query: string;
  route?: ResearchRoute;
  limit?: number;
}

function createHttpError(status: number, message: string): Error {
  const err = new Error(message);
  (err as any).status = status;
  return err;
}

export class ResearchService {
  /**
   * Initializes and queues a research session asynchronously
   */
  public static async queueResearch(input: StartResearchInput): Promise<{
    researchSessionId: string;
    status: string;
    route: ResearchRoute;
    reasons: string[];
  }> {
    const rawQuery = String(input.query || '').trim();
    if (!rawQuery) {
      throw createHttpError(400, 'query is required.');
    }

    // 1. Determine routing decision
    const decision = QueryRouter.route(rawQuery);
    const selectedRoute: ResearchRoute = input.route || decision.route;

    // 2. Insert research_sessions record as QUEUED
    const insertRes = await db.query(
      `INSERT INTO research_sessions (
        organization_id, user_id, query, route, status, metadata
      ) VALUES ($1, $2, $3, $4, 'QUEUED', $5) RETURNING id`,
      [
        input.organizationId,
        input.userId || null,
        rawQuery,
        selectedRoute,
        JSON.stringify({
          routingDecision: decision,
          requestedLimit: input.limit || 5
        })
      ]
    );

    const sessionId = insertRes.rows[0].id;

    // 3. Kick off async execution worker without blocking API response
    setImmediate(() => {
      ResearchService.executeResearchWorker(sessionId, input.organizationId, rawQuery, selectedRoute, input.limit || 5)
        .catch(err => {
          console.error(`[Research Worker Error] Session ${sessionId} failed:`, err);
        });
    });

    return {
      researchSessionId: sessionId,
      status: 'QUEUED',
      route: selectedRoute,
      reasons: decision.reasons
    };
  }

  /**
   * Background execution worker
   */
  public static async executeResearchWorker(
    sessionId: string,
    organizationId: string,
    query: string,
    route: ResearchRoute,
    limit: number = 5
  ): Promise<void> {
    const startedAt = Date.now();
    await db.query(
      `UPDATE research_sessions SET status = 'RUNNING', started_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [sessionId]
    );

    try {
      if (route === 'INTERNAL_KNOWLEDGE') {
        await this.executeInternalKnowledge(sessionId, organizationId, query);
      } else if (route === 'CRAWL_DATABASE') {
        await this.executeCrawlDatabase(sessionId, organizationId, query);
      } else if (route === 'WEB_RESEARCH') {
        await this.executeWebResearch(sessionId, organizationId, query, limit);
      } else if (route === 'HYBRID_RESEARCH') {
        await this.executeHybridResearch(sessionId, organizationId, query, limit);
      }

      const durationMs = Date.now() - startedAt;
      await db.query(
        `UPDATE research_sessions SET
          status = 'COMPLETED',
          completed_at = CURRENT_TIMESTAMP,
          metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{durationMs}', $1::jsonb)
         WHERE id = $2`,
        [JSON.stringify(durationMs), sessionId]
      );
    } catch (err: any) {
      console.error(`[Research Worker Exception] Session ${sessionId}:`, err);
      await db.query(
        `UPDATE research_sessions SET
          status = 'FAILED',
          completed_at = CURRENT_TIMESTAMP,
          metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{error}', $1::jsonb)
         WHERE id = $2`,
        [JSON.stringify(err.message || 'Execution failed'), sessionId]
      );
    }
  }

  /**
   * Internal Knowledge Route: Queries ground-truth graph and pgvector store
   */
  private static async executeInternalKnowledge(sessionId: string, organizationId: string, query: string): Promise<void> {
    const semanticMatches = await KnowledgeService.searchSemantic(organizationId, query, 3);
    const entitiesRes = await db.query(
      `SELECT id, name, entity_type, attributes FROM knowledge_entities
       WHERE organization_id = $1 AND is_verified = TRUE LIMIT 10`,
      [organizationId]
    );

    // Save as internal knowledge source
    const sourceRes = await db.query(
      `INSERT INTO research_sources (
        organization_id, research_session_id, provider, url, title, domain,
        snippet, search_rank, source_quality_tier, relevance_score, http_status
      ) VALUES ($1, $2, 'INTERNAL_GROUND_TRUTH', 'internal://knowledge-graph', 'Webkorps Ground Truth Knowledge Graph', 'internal',
        'Verified corporate knowledge graph & pgvector embeddings', 1, 'TIER_1', 1.0, 200) RETURNING id`,
      [organizationId, sessionId]
    );
    const sourceId = sourceRes.rows[0].id;

    for (const match of semanticMatches) {
      await db.query(
        `INSERT INTO research_evidence (
          organization_id, research_session_id, research_source_id, evidence_text, evidence_type, relevance_score
        ) VALUES ($1, $2, $3, $4, 'KNOWLEDGE_CHUNK', $5)`,
        [organizationId, sessionId, sourceId, match.chunk_text, Number((1 - match.distance).toFixed(3))]
      );
    }
  }

  /**
   * Crawl Database Route: Queries website crawl runs, pages, and SEO issues
   */
  private static async executeCrawlDatabase(sessionId: string, organizationId: string, query: string): Promise<void> {
    const webRes = await db.query(
      `SELECT id, domain FROM websites WHERE organization_id = $1 LIMIT 1`,
      [organizationId]
    );
    const websiteId = webRes.rows[0]?.id;

    let pageCount = 0;
    let issuesCount = 0;
    let sampleIssues: any[] = [];

    if (websiteId) {
      const pRes = await db.query(`SELECT count(*) as count FROM pages WHERE website_id = $1`, [websiteId]);
      pageCount = parseInt(pRes.rows[0].count, 10);

      const iRes = await db.query(
        `SELECT issue_type, severity, description FROM seo_issues WHERE website_id = $1 LIMIT 5`,
        [websiteId]
      );
      issuesCount = iRes.rows.length;
      sampleIssues = iRes.rows;
    }

    const sourceRes = await db.query(
      `INSERT INTO research_sources (
        organization_id, research_session_id, provider, url, title, domain,
        snippet, search_rank, source_quality_tier, relevance_score, http_status
      ) VALUES ($1, $2, 'CRAWL_DATABASE', 'internal://crawl-database', 'Website Crawl Database & SEO Audits', 'internal',
        $3, 1, 'TIER_1', 1.0, 200) RETURNING id`,
      [
        organizationId,
        sessionId,
        `Audited ${pageCount} pages with ${issuesCount} verified SEO findings.`
      ]
    );
    const sourceId = sourceRes.rows[0].id;

    const evidenceText = `Crawl Database Summary: ${pageCount} pages crawled on website. Discovered issues: ${sampleIssues.map(i => `${i.issue_type} (${i.severity}): ${i.description}`).join('; ')}`;
    await db.query(
      `INSERT INTO research_evidence (
        organization_id, research_session_id, research_source_id, evidence_text, evidence_type, relevance_score
      ) VALUES ($1, $2, $3, $4, 'CRAWL_AUDIT', 0.95)`,
      [organizationId, sessionId, sourceId, evidenceText]
    );
  }

  /**
   * Web Research Route: Live search, fetch, extraction, ranking, and provenance storage
   */
  private static async executeWebResearch(
    sessionId: string,
    organizationId: string,
    query: string,
    limit: number
  ): Promise<void> {
    const cacheKey = `search:${query}`;
    let searchResults = ResearchCache.get<any[]>(cacheKey);

    if (!searchResults) {
      const provider = SearchProviderFactory.getProvider();
      const response = await provider.search({ query, limit });
      searchResults = response.results;
      ResearchCache.set(cacheKey, searchResults);
    }

    const ranked = RelevanceRanker.rank(query, searchResults, limit);
    let fetchedCount = 0;

    for (const item of ranked) {
      const guard = await SSRFGuard.validateUrl(item.result.url);
      if (!guard.safe) continue;

      let extractedText = item.result.snippet || '';
      let httpStatus = 200;
      let contentType = 'text/html';

      // Check URL cache
      const urlCacheKey = `page:${item.normalizedUrl}`;
      const cachedText = ResearchCache.get<string>(urlCacheKey);

      if (cachedText) {
        extractedText = cachedText;
      } else {
        try {
          const fetchRes = await fetch(item.result.url, {
            headers: {
              'User-Agent': 'CorpTalk-Research/1.0 (Polite Web Intelligence)',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            signal: AbortSignal.timeout(6000)
          });
          httpStatus = fetchRes.status;
          contentType = fetchRes.headers.get('content-type') || 'text/html';

          if (fetchRes.ok && contentType.includes('text/html')) {
            const html = await fetchRes.text();
            const extracted = HtmlExtractor.extract(html, item.result.url, item.result.domain);
            if (extracted.cleanText && extracted.cleanText.length > 50) {
              extractedText = extracted.cleanText;
              ResearchCache.set(urlCacheKey, extractedText);
            }
          }
        } catch {
          // If fetch fails, we retain the snippet from search results
          httpStatus = 504;
        }
      }

      fetchedCount++;

      // Save to research_sources
      const srcInsert = await db.query(
        `INSERT INTO research_sources (
          organization_id, research_session_id, provider, url, canonical_url, title,
          domain, snippet, search_rank, source_quality_tier, relevance_score,
          http_status, content_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
        [
          organizationId,
          sessionId,
          item.result.sourceProvider || 'searxng',
          item.result.url,
          item.normalizedUrl,
          item.result.title,
          item.result.domain,
          item.result.snippet || '',
          item.result.rank || 1,
          item.qualityTier,
          item.relevanceScore,
          httpStatus,
          contentType
        ]
      );
      const sourceId = srcInsert.rows[0].id;

      // Extract passages and save to research_evidence
      const passages = RelevanceRanker.extractPassages(query, extractedText, 2);
      if (passages.length === 0 && item.result.snippet) {
        passages.push({ text: item.result.snippet, score: item.relevanceScore });
      }

      for (const p of passages) {
        await db.query(
          `INSERT INTO research_evidence (
            organization_id, research_session_id, research_source_id, evidence_text, evidence_type, relevance_score
          ) VALUES ($1, $2, $3, $4, 'PASSAGE', $5)`,
          [organizationId, sessionId, sourceId, p.text, p.score]
        );
      }
    }
  }

  /**
   * Hybrid Research Route: Combines internal ground truth, crawl audits, and web research
   */
  private static async executeHybridResearch(
    sessionId: string,
    organizationId: string,
    query: string,
    limit: number
  ): Promise<void> {
    await this.executeInternalKnowledge(sessionId, organizationId, query);
    await this.executeCrawlDatabase(sessionId, organizationId, query);
    try {
      await this.executeWebResearch(sessionId, organizationId, query, Math.max(3, limit));
    } catch (e) {
      console.warn('[Hybrid Research] External web search step encountered warning:', e);
    }
  }

  // --- Read Methods with Strict Tenant Isolation ---

  public static async getSession(organizationId: string, sessionId: string): Promise<any> {
    const res = await db.query(
      `SELECT * FROM research_sessions WHERE id = $1 AND organization_id = $2`,
      [sessionId, organizationId]
    );
    if (res.rows.length === 0) {
      throw createHttpError(404, 'Research session not found or access denied.');
    }
    return res.rows[0];
  }

  public static async getSessionSources(organizationId: string, sessionId: string): Promise<any[]> {
    await this.getSession(organizationId, sessionId);
    const res = await db.query(
      `SELECT * FROM research_sources WHERE research_session_id = $1 AND organization_id = $2 ORDER BY relevance_score DESC, search_rank ASC`,
      [sessionId, organizationId]
    );
    return res.rows;
  }

  public static async getSessionEvidence(organizationId: string, sessionId: string): Promise<any[]> {
    await this.getSession(organizationId, sessionId);
    const res = await db.query(
      `SELECT e.*, s.title as source_title, s.url as source_url, s.domain as source_domain
       FROM research_evidence e
       JOIN research_sources s ON e.research_source_id = s.id
       WHERE e.research_session_id = $1 AND e.organization_id = $2
       ORDER BY e.relevance_score DESC`,
      [sessionId, organizationId]
    );
    return res.rows;
  }

  public static async listSessions(
    organizationId: string,
    filters?: { route?: string; status?: string; page?: number; limit?: number }
  ): Promise<any[]> {
    const page = Math.max(1, filters?.page || 1);
    const limit = Math.min(50, Math.max(1, filters?.limit || 20));
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM research_sessions WHERE organization_id = $1`;
    const params: any[] = [organizationId];

    if (filters?.route) {
      params.push(filters.route);
      query += ` AND route = $${params.length}`;
    }
    if (filters?.status) {
      params.push(filters.status);
      query += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    const res = await db.query(query, params);
    return res.rows;
  }

  /**
   * Directly executes live search, relevance ranking, and evidence extraction for runtime assistant query
   */
  public static async performRuntimeWebSearch(
    organizationId: string,
    query: string,
    limit: number = 3
  ): Promise<Array<{
    title: string;
    url: string;
    snippet: string;
    domain: string;
    trustTier: 'OFFICIAL_WEBKORPS' | 'OFFICIAL_EXTERNAL' | 'AUTHORITATIVE_EXTERNAL' | 'SECONDARY' | 'LOW_CONFIDENCE';
    relevance: number;
  }>> {
    try {
      const provider = SearchProviderFactory.getProvider();
      const response = await provider.search({ query, limit: Math.max(limit, 5) });
      const ranked = RelevanceRanker.rank(query, response.results, limit);

      const results: Array<{
        title: string;
        url: string;
        snippet: string;
        domain: string;
        trustTier: 'OFFICIAL_WEBKORPS' | 'OFFICIAL_EXTERNAL' | 'AUTHORITATIVE_EXTERNAL' | 'SECONDARY' | 'LOW_CONFIDENCE';
        relevance: number;
      }> = [];

      for (const item of ranked) {
        const domain = (item.result.domain || '').toLowerCase();
        let trustTier: 'OFFICIAL_WEBKORPS' | 'OFFICIAL_EXTERNAL' | 'AUTHORITATIVE_EXTERNAL' | 'SECONDARY' | 'LOW_CONFIDENCE' = 'SECONDARY';

        if (domain.includes('webkorps.com')) {
          trustTier = 'OFFICIAL_WEBKORPS';
        } else if (domain.includes('linkedin.com') || domain.includes('github.com') || domain.includes('crunchbase.com') || domain.includes('clutch.co')) {
          trustTier = 'AUTHORITATIVE_EXTERNAL';
        } else if (domain.includes('medium.com') || domain.includes('techcrunch.com') || domain.includes('news')) {
          trustTier = 'SECONDARY';
        } else if (item.qualityTier === 'TIER_5') {
          trustTier = 'LOW_CONFIDENCE';
        }

        results.push({
          title: item.result.title,
          url: item.result.url,
          snippet: item.result.snippet || '',
          domain: item.result.domain,
          trustTier,
          relevance: item.relevanceScore
        });
      }

      return results;
    } catch (err: any) {
      console.warn('[ResearchService] Runtime web search warning:', err.message);
      return [];
    }
  }
}
