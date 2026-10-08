function createHttpError(status: number, message: string): Error {
  const err = new Error(message);
  (err as any).status = status;
  return err;
}

import { db } from '../../db/client.js';
import { SSRFGuard } from './ssrfGuard.js';
import { URLNormalizer } from './urlNormalizer.js';
import { RobotsParser } from './robotsParser.js';
import { SitemapParser } from './sitemapParser.js';
import { HtmlExtractor } from './htmlExtractor.js';
import { SeoAnalyzer } from './seoAnalyzer.js';
import { KnowledgeCandidateExtractor } from './knowledgeCandidateExtractor.js';
import { AuditLogger } from '../audit/auditLogger.js';
import { BrowserRenderer } from './browserRenderer.js';

export interface StartCrawlInput {
  organizationId: string;
  websiteId?: string;
  startUrl?: string;
  targetUrl?: string;
  scope?: "PAGE" | "DIRECTORY" | "DOMAIN" | "SITEMAP";
  maxPages?: number;
  respectRobots?: boolean;
  followSitemaps?: boolean;
  renderJavascript?: boolean;
  executeWorker?: boolean;
}

export class CrawlerService {
  /**
   * Initializes and queues a crawl run without blocking API response
   */
  public static async queueCrawl(input: StartCrawlInput): Promise<{ crawlRunId: string; status: string; targetUrl: string }> {
    const rawTarget = input.targetUrl || input.startUrl;
    if (!rawTarget && !input.websiteId) {
      throw createHttpError(400, "Either websiteId or targetUrl (startUrl) is required.");
    }

    let websiteId = input.websiteId;
    let targetDomain = "";
    let startUrl = rawTarget || "";

    if (websiteId) {
      const webRes = await db.query(
        `SELECT id, domain FROM websites WHERE id = $1 AND organization_id = $2`,
        [websiteId, input.organizationId]
      );
      if (webRes.rows.length === 0) {
        throw createHttpError(404, "Website not found or access denied.");
      }
      targetDomain = webRes.rows[0].domain;
      if (!startUrl) {
        startUrl = `https://${targetDomain}`;
      }
    } else if (rawTarget) {
      const ssrfCheck = await SSRFGuard.validateUrl(rawTarget, { allowLocal: true });
      if (!ssrfCheck.safe) {
        throw createHttpError(400, `Target URL rejected: ${ssrfCheck.reason}`);
      }

      targetDomain = new URL(rawTarget).hostname;
      const webRes = await db.query(
        `SELECT id, domain FROM websites WHERE domain = $1 AND organization_id = $2`,
        [targetDomain, input.organizationId]
      );
      if (webRes.rows.length > 0) {
        websiteId = webRes.rows[0].id;
      } else {
        const insertWeb = await db.query(
          `INSERT INTO websites (organization_id, domain, name, is_primary)
           VALUES ($1, $2, $3, false)
           RETURNING id`,
          [input.organizationId, targetDomain, targetDomain]
        );
        websiteId = insertWeb.rows[0].id;
      }
    }

    const scope = input.scope || "DOMAIN";
    const maxPages = scope === "PAGE" ? 1 : Math.min(Math.max(input.maxPages || 50, 1), 1000);
    const respectRobots = input.respectRobots !== false;
    const followSitemaps = input.followSitemaps !== false;
    const renderJavascript = Boolean(input.renderJavascript);

    // 2. Insert crawl_runs record as QUEUED
    const runRes = await db.query(
      `INSERT INTO crawl_runs (organization_id, website_id, status, max_pages, pages_discovered, pages_crawled, pages_failed, target_url, scope, render_javascript)
       VALUES ($1, $2, 'QUEUED', $3, 1, 0, 0, $4, $5, $6)
       RETURNING id, status`,
      [input.organizationId, websiteId, maxPages, startUrl, scope, renderJavascript]
    );

    const crawlRunId = runRes.rows[0].id;

    await AuditLogger.log({
      organizationId: input.organizationId,
      action: "CRAWL_QUEUED",
      entityType: "CRAWL_RUN",
      entityId: crawlRunId,
      details: { websiteId, startUrl, maxPages, scope, renderJavascript }
    });

    // 3. Dispatch worker asynchronously
    if (input.executeWorker !== false) {
    setImmediate(() => {
      this.executeCrawl(crawlRunId, input.organizationId, websiteId!, startUrl, targetDomain, maxPages, {
        scope,
        respectRobots,
        followSitemaps,
        renderJavascript
      }).catch(err => console.error(`[Crawler Worker Error] Crawl run ${crawlRunId} failed:`, err));
    });
    }

    return { crawlRunId, status: "QUEUED", targetUrl: startUrl };
  }

  /**
   * Background Crawler Execution Pipeline
   */
  public static async executeCrawl(
    crawlRunId: string,
    organizationId: string,
    websiteId: string,
    startUrl: string,
    targetDomain: string,
    maxPages: number,
    options: {
      scope?: "PAGE" | "DIRECTORY" | "DOMAIN" | "SITEMAP";
      respectRobots?: boolean;
      followSitemaps?: boolean;
      renderJavascript?: boolean;
    } = {}
  ): Promise<void> {
    const scope = options.scope || "DOMAIN";
    const respectRobots = options.respectRobots !== false;
    const followSitemaps = options.followSitemaps !== false;
    const renderJavascript = Boolean(options.renderJavascript);
    const startTime = Date.now();
    console.log(`[Crawler Worker] Starting crawl run ${crawlRunId} for ${startUrl} (max ${maxPages} pages)`);

    // 1. Mark as RUNNING
    await db.query(
      `UPDATE crawl_runs SET status = 'RUNNING', started_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [crawlRunId]
    );

    // 2. SSRF Guard Check on target domain
    const ssrfCheck = await SSRFGuard.validateUrl(startUrl, { allowLocal: true });
    if (!ssrfCheck.safe) {
      await db.query(
        `UPDATE crawl_runs SET status = 'FAILED', error_message = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [`SSRF Blocked: ${ssrfCheck.reason}`, crawlRunId]
      );
      return;
    }

    // 3. Fetch robots.txt
    console.log(`[Crawler Worker] Fetching robots.txt for ${startUrl}`);
    const robotsParser = await RobotsParser.fetchAndParse(startUrl);
    const robotsSummary = robotsParser.getSummary();
    await db.query(
      `UPDATE crawl_runs SET robots_status = $1, metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{robots}', $2::jsonb) WHERE id = $3`,
      [robotsParser.exists ? 'PARSED' : 'NOT_FOUND', JSON.stringify(robotsSummary), crawlRunId]
    );

    // 4. Discover Sitemaps
    console.log(`[Crawler Worker] Discovering sitemaps for ${startUrl}`);
    const sitemapEntries = await SitemapParser.discoverSitemaps(startUrl, robotsSummary.sitemaps);
    await db.query(
      `UPDATE crawl_runs SET sitemap_status = $1 WHERE id = $2`,
      [sitemapEntries.length > 0 ? 'PARSED' : 'NOT_FOUND', crawlRunId]
    );

    // 5. Initialize Queue & Visited Sets
    const queue: string[] = [];
    const visited = new Set<string>();
    const discovered = new Set<string>();

    const normalizedStart = URLNormalizer.normalize(startUrl) || startUrl;
    queue.push(normalizedStart);
    discovered.add(normalizedStart);

    // Add priority sitemap entries to queue
    for (const entry of sitemapEntries) {
      if (discovered.size >= maxPages) break;
      if (!discovered.has(entry.url) && URLNormalizer.isSameDomain(entry.url, targetDomain)) {
        queue.push(entry.url);
        discovered.add(entry.url);
      }
    }

    let crawledCount = 0;
    let failedCount = 0;
    let totalInternalLinks = 0;
    let totalExternalLinks = 0;
    let totalIssuesFound = 0;
    let totalCandidates = 0;

    // 6. Crawl Loop
    while (queue.length > 0 && crawledCount < maxPages) {
      const currentUrl = queue.shift()!;
      if (visited.has(currentUrl)) continue;
      visited.add(currentUrl);

      // Respect robots.txt (unless explicitly bypassed)
      if (respectRobots && !robotsParser.isAllowed(currentUrl)) {
        console.log(`[Crawler Worker] URL disbarred by robots.txt: ${currentUrl}`);
        continue;
      }

      console.log(`[Crawler Worker] Crawling [${crawledCount + 1}/${maxPages}]: ${currentUrl}`);
      const pageStartTime = Date.now();

      let timeout: any;
      try {
        const controller = new AbortController();
        timeout = setTimeout(() => controller.abort(), 8000);

        let rawHtml = "";
        let httpStatus = 200;
        let contentType = "text/html";
        let responseTime = 0;

        if (renderJavascript) {
          const rendered = await BrowserRenderer.render(currentUrl);
          rawHtml = rendered.html;
          responseTime = Date.now() - pageStartTime;
        } else {
          const res = await fetch(currentUrl, {
            headers: {
              "User-Agent": "CorpTalkBot/1.0 (+https://corp-talk.ai/bot; Web Intelligence Engine)",
              "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8"
            },
            redirect: "follow",
            signal: controller.signal
          });
          clearTimeout(timeout);
          responseTime = Date.now() - pageStartTime;
          httpStatus = res.status;
          contentType = res.headers.get("content-type") || "text/html";
          if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
            continue;
          }
          rawHtml = await res.text();
        }

        // Extract Content, Headings, Meta, Images, Schemas, Links
        const extracted = HtmlExtractor.extract(rawHtml, currentUrl, targetDomain);

        // Analyze SEO Signals & Deterministic Issues
        const seoResult = SeoAnalyzer.analyze(currentUrl, httpStatus, extracted);

        // Check Previous Snapshot to detect Change State (NEW vs UNCHANGED vs UPDATED)
        const prevSnap = await db.query(
          `SELECT s.content_hash FROM crawl_page_snapshots s
           JOIN pages p ON s.page_id = p.id
           WHERE p.website_id = $1 AND p.url = $2
           ORDER BY s.crawled_at DESC LIMIT 1`,
          [websiteId, currentUrl]
        );

        let statusChange: 'NEW' | 'UNCHANGED' | 'UPDATED' = 'NEW';
        if (prevSnap.rows.length > 0) {
          statusChange = prevSnap.rows[0].content_hash === extracted.contentHash ? 'UNCHANGED' : 'UPDATED';
        }

        // Upsert pages record
        const pagePath = URLNormalizer.getPath(currentUrl);
        const pageRes = await db.query(
          `INSERT INTO pages (
            organization_id, website_id, url, path, canonical_url, http_status,
            title, meta_description, word_count, content_hash, last_crawled_at,
            indexability, indexability_reason, response_time_ms, content_type,
            outbound_internal_links_count, outbound_external_links_count
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (website_id, url) DO UPDATE SET
            path = EXCLUDED.path,
            canonical_url = EXCLUDED.canonical_url,
            http_status = EXCLUDED.http_status,
            title = EXCLUDED.title,
            meta_description = EXCLUDED.meta_description,
            word_count = EXCLUDED.word_count,
            content_hash = EXCLUDED.content_hash,
            last_crawled_at = CURRENT_TIMESTAMP,
            indexability = EXCLUDED.indexability,
            indexability_reason = EXCLUDED.indexability_reason,
            response_time_ms = EXCLUDED.response_time_ms,
            content_type = EXCLUDED.content_type,
            outbound_internal_links_count = EXCLUDED.outbound_internal_links_count,
            outbound_external_links_count = EXCLUDED.outbound_external_links_count
          RETURNING id`,
          [
            organizationId,
            websiteId,
            currentUrl,
            pagePath,
            extracted.canonicalUrl,
            httpStatus,
            extracted.title,
            extracted.metaDescription,
            extracted.wordCount,
            extracted.contentHash,
            seoResult.indexability,
            seoResult.indexabilityReason,
            responseTime,
            contentType,
            extracted.internalLinks.length,
            extracted.externalLinks.length
          ]
        );

        const pageId = pageRes.rows[0].id;

        // Save Snapshot
        await db.query(
          `INSERT INTO crawl_page_snapshots (
            organization_id, page_id, crawl_run_id, h1_tags, h2_tags, h3_tags,
            images, links_internal, links_external, schema_jsonld, extracted_text,
            content_hash, headings, status_change
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            organizationId,
            pageId,
            crawlRunId,
            extracted.h1Tags,
            extracted.h2Tags,
            extracted.h3Tags,
            JSON.stringify(extracted.images),
            JSON.stringify(extracted.internalLinks),
            JSON.stringify(extracted.externalLinks),
            JSON.stringify(extracted.schemas),
            extracted.cleanText.slice(0, 50000), // Protect against memory blowout
            extracted.contentHash,
            JSON.stringify(extracted.headings),
            statusChange
          ]
        );

        // Store Links into link graph
        for (const link of extracted.links) {
          await db.query(
            `INSERT INTO page_links (organization_id, website_id, crawl_run_id, source_url, target_url, anchor_text, is_internal, rel)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              organizationId,
              websiteId,
              crawlRunId,
              currentUrl,
              link.absoluteUrl,
              link.anchorText || null,
              link.isInternal,
              link.rel || null
            ]
          );
        }
        totalInternalLinks += extracted.internalLinks.length;
        totalExternalLinks += extracted.externalLinks.length;

        // Persist SEO Issues
        for (const issue of seoResult.issues) {
          await db.query(
            `INSERT INTO seo_issues (organization_id, website_id, page_id, issue_type, severity, evidence, recommendation, description, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'OPEN')`,
            [
              organizationId,
              websiteId,
              pageId,
              issue.issueType,
              issue.severity,
              JSON.stringify(issue.evidence),
              issue.recommendation,
              issue.recommendation
            ]
          );
          totalIssuesFound++;
        }

        // Process Knowledge Candidates
        const candidates = await KnowledgeCandidateExtractor.processCandidates(organizationId, currentUrl, extracted);
        totalCandidates += candidates;

        // Enqueue new internal links based on Scope
        if (scope !== "PAGE" && scope !== "SITEMAP") {
          const dirPrefix = scope === "DIRECTORY" ? (new URL(startUrl).pathname.replace(/\/$/, "") + "/") : null;
          for (const internalLink of extracted.internalLinks) {
            if (discovered.size < maxPages && !discovered.has(internalLink.absoluteUrl)) {
              if (dirPrefix && !new URL(internalLink.absoluteUrl).pathname.startsWith(dirPrefix)) {
                continue;
              }
              discovered.add(internalLink.absoluteUrl);
              queue.push(internalLink.absoluteUrl);
            }
          }
        }

        crawledCount++;

        // Rate limiting: polite delay between requests if queue has remaining items
        if (queue.length > 0 && crawledCount < maxPages) {
          await new Promise(r => setTimeout(r, 50));
        }

      } catch (err: any) {
        failedCount++;
        console.error(`[Crawler Worker] Failed crawling ${currentUrl}:`, err.message);
      } finally {
        if (timeout) clearTimeout(timeout);
      }
    }

    // 7. Post-Crawl: Compute Inbound Internal Link Graph Counts
    await db.query(
      `UPDATE pages p
       SET inbound_internal_links_count = (
         SELECT count(*) FROM page_links pl
         WHERE pl.website_id = p.website_id AND pl.target_url = p.url AND pl.is_internal = TRUE
       )
       WHERE p.website_id = $1`,
      [websiteId]
    );

    // 8. Detect Orphan Pages
    const orphanRes = await db.query(
      `SELECT id, url FROM pages
       WHERE website_id = $1 AND inbound_internal_links_count = 0 AND url != $2`,
      [websiteId, normalizedStart]
    );

    for (const orphan of orphanRes.rows) {
      await db.query(
        `INSERT INTO seo_issues (organization_id, website_id, page_id, issue_type, severity, evidence, recommendation, description, status)
         VALUES ($1, $2, $3, 'ORPHAN_PAGE', 'HIGH', $4, 'Connect page via internal navigation or contextual internal links.', 'Orphan page: No inbound internal links detected.', 'OPEN')`,
        [
          organizationId,
          websiteId,
          orphan.id,
          JSON.stringify({ url: orphan.url, inboundInternalLinks: 0 })
        ]
      );
    }

    // 9. Finalize Crawl Run
    const duration = Date.now() - startTime;
    const finalStatus = crawledCount > 0 ? (failedCount > 0 ? 'PARTIAL' : 'COMPLETED') : 'FAILED';

    const crawlSummary = {
      pagesDiscovered: discovered.size,
      pagesCrawled: crawledCount,
      pagesFailed: failedCount,
      totalInternalLinks,
      totalExternalLinks,
      totalIssuesFound,
      totalCandidates,
      durationMs: duration
    };

    await db.query(
      `UPDATE crawl_runs SET
        status = $1,
        pages_discovered = $2,
        pages_crawled = $3,
        pages_failed = $4,
        duration_ms = $5,
        completed_at = CURRENT_TIMESTAMP,
        metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{summary}', $6::jsonb)
       WHERE id = $7`,
      [finalStatus, discovered.size, crawledCount, failedCount, duration, JSON.stringify(crawlSummary), crawlRunId]
    );

    await AuditLogger.log({
      organizationId,
      action: 'CRAWL_COMPLETED',
      entityType: 'CRAWL_RUN',
      entityId: crawlRunId,
      details: crawlSummary
    });

    console.log(`[Crawler Worker] Finished crawl run ${crawlRunId} with status ${finalStatus} in ${duration}ms`);
  }

  public static async getCrawlStatus(organizationId: string, crawlRunId: string): Promise<any> {
    const res = await db.query(
      `SELECT * FROM crawl_runs WHERE id = $1 AND organization_id = $2`,
      [crawlRunId, organizationId]
    );
    if (res.rows.length === 0) {
      throw createHttpError(404, 'Crawl run not found or access denied.');
    }
    return res.rows[0];
  }

  public static async getWebsiteCrawls(organizationId: string, websiteId: string): Promise<any[]> {
    const res = await db.query(
      `SELECT * FROM crawl_runs WHERE website_id = $1 AND organization_id = $2 ORDER BY started_at DESC LIMIT 20`,
      [websiteId, organizationId]
    );
    return res.rows;
  }

  public static async getWebsitePages(
    organizationId: string,
    websiteId: string,
    filters?: { indexability?: string; httpStatus?: number; search?: string }
  ): Promise<any[]> {
    let query = `SELECT * FROM pages WHERE website_id = $1 AND organization_id = $2`;
    const params: any[] = [websiteId, organizationId];

    if (filters?.indexability) {
      params.push(filters.indexability);
      query += ` AND indexability = $${params.length}`;
    }
    if (filters?.httpStatus) {
      params.push(filters.httpStatus);
      query += ` AND http_status = $${params.length}`;
    }
    if (filters?.search) {
      params.push(`%${filters.search}%`);
      query += ` AND (url ILIKE $${params.length} OR title ILIKE $${params.length})`;
    }

    query += ` ORDER BY last_crawled_at DESC LIMIT 100`;
    const res = await db.query(query, params);
    return res.rows;
  }

  public static async getPageDetails(organizationId: string, websiteId: string, pageId: string): Promise<any> {
    const pageRes = await db.query(
      `SELECT * FROM pages WHERE id = $1 AND website_id = $2 AND organization_id = $3`,
      [pageId, websiteId, organizationId]
    );
    if (pageRes.rows.length === 0) {
      throw createHttpError(404, 'Page not found.');
    }

    const snapRes = await db.query(
      `SELECT * FROM crawl_page_snapshots WHERE page_id = $1 ORDER BY crawled_at DESC LIMIT 1`,
      [pageId]
    );

    const issuesRes = await db.query(
      `SELECT * FROM seo_issues WHERE page_id = $1 ORDER BY severity, created_at DESC`,
      [pageId]
    );

    const inLinksRes = await db.query(
      `SELECT source_url, anchor_text FROM page_links WHERE target_url = $1 AND website_id = $2 AND is_internal = TRUE LIMIT 50`,
      [pageRes.rows[0].url, websiteId]
    );

    return {
      page: pageRes.rows[0],
      latestSnapshot: snapRes.rows[0] || null,
      issues: issuesRes.rows,
      inboundInternalLinks: inLinksRes.rows
    };
  }

  public static async getWebsiteSeoIssues(organizationId: string, websiteId: string, severity?: string): Promise<any[]> {
    let query = `
      SELECT i.*, p.url as page_url, p.title as page_title
      FROM seo_issues i
      LEFT JOIN pages p ON i.page_id = p.id
      WHERE i.website_id = $1 AND i.organization_id = $2
    `;
    const params: any[] = [websiteId, organizationId];

    if (severity) {
      params.push(severity);
      query += ` AND i.severity = $${params.length}`;
    }

    query += ` ORDER BY CASE i.severity
      WHEN 'CRITICAL' THEN 1
      WHEN 'HIGH' THEN 2
      WHEN 'MEDIUM' THEN 3
      WHEN 'LOW' THEN 4
      ELSE 5 END, i.created_at DESC LIMIT 200`;

    const res = await db.query(query, params);
    return res.rows;
  }

  public static async getCrawlSummary(organizationId: string, websiteId: string): Promise<any> {
    const totalPagesRes = await db.query(
      `SELECT count(*) as count,
              count(CASE WHEN indexability = 'INDEXABLE' THEN 1 END) as indexable_count,
              count(CASE WHEN http_status = 200 THEN 1 END) as ok_count
       FROM pages WHERE website_id = $1 AND organization_id = $2`,
      [websiteId, organizationId]
    );

    const issuesCountRes = await db.query(
      `SELECT severity, count(*) as count
       FROM seo_issues
       WHERE website_id = $1 AND organization_id = $2
       GROUP BY severity`,
      [websiteId, organizationId]
    );

    const candidatesRes = await db.query(
      `SELECT count(*) as count
       FROM knowledge_entities
       WHERE organization_id = $1 AND verification_status = 'DISCOVERED'`,
      [organizationId]
    );

    return {
      pages: totalPagesRes.rows[0],
      issuesBySeverity: issuesCountRes.rows.reduce((acc: any, cur: any) => {
        acc[cur.severity] = parseInt(cur.count, 10);
        return acc;
      }, {}),
      knowledgeCandidatesDiscovered: parseInt(candidatesRes.rows[0]?.count || '0', 10)
    };
  }
}
