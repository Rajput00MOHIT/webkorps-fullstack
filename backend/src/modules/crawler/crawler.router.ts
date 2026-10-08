import { Router } from 'express';
import type { Response } from 'express';
import type { TenantRequest } from '../../middleware/tenantContext.js';
import { CrawlerService } from './crawlerService.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

export const crawlerRouter = Router();

/**
 * POST /api/v1/crawl
 * Asynchronous crawl trigger
 */
crawlerRouter.post('/crawl', requireAuth, requireRole(['OWNER', 'ADMIN', 'SEO_MANAGER', 'EDITOR']), async (req: TenantRequest, res: Response, next) => {
  try {
    const { websiteId, startUrl, targetUrl, scope, maxPages, respectRobots, followSitemaps, renderJavascript } = req.body;
    const finalUrl = targetUrl || startUrl;
    if (!websiteId && !finalUrl) {
      res.status(400).json({ error: { message: "Either websiteId or targetUrl (startUrl) is required." } });
      return;
    }

    const result = await CrawlerService.queueCrawl({
      organizationId: req.tenantId!,
      websiteId,
      startUrl: finalUrl,
      targetUrl: finalUrl,
      scope,
      maxPages: maxPages ? parseInt(String(maxPages), 10) : undefined,
      respectRobots: respectRobots !== false,
      followSitemaps: followSitemaps !== false,
      renderJavascript: Boolean(renderJavascript)
    });

    res.status(202).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/crawl/:crawlRunId
 * Check crawl progress and status
 */
crawlerRouter.get('/crawl/:crawlRunId', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const status = await CrawlerService.getCrawlStatus(req.tenantId!, String(req.params.crawlRunId));
    res.json(status);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/websites/:websiteId/crawls
 * History of crawls for a website
 */
crawlerRouter.get('/websites/:websiteId/crawls', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const history = await CrawlerService.getWebsiteCrawls(req.tenantId!, String(req.params.websiteId));
    res.json({ crawls: history, total: history.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/websites/:websiteId/pages
 * Crawled pages with indexability & HTTP status filters
 */
crawlerRouter.get('/websites/:websiteId/pages', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const { indexability, httpStatus, search } = req.query;
    const pages = await CrawlerService.getWebsitePages(req.tenantId!, String(req.params.websiteId), {
      indexability: indexability as string | undefined,
      httpStatus: httpStatus ? parseInt(String(httpStatus), 10) : undefined,
      search: search as string | undefined
    });
    res.json({ pages, total: pages.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/websites/:websiteId/pages/:pageId
 * Single page detail, headings, snapshot & issues
 */
crawlerRouter.get('/websites/:websiteId/pages/:pageId', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const details = await CrawlerService.getPageDetails(req.tenantId!, String(req.params.websiteId), String(req.params.pageId));
    res.json(details);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/websites/:websiteId/seo/issues
 * Explanations and evidence for deterministic SEO issues
 */
crawlerRouter.get('/websites/:websiteId/seo/issues', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const { severity } = req.query;
    const issues = await CrawlerService.getWebsiteSeoIssues(req.tenantId!, String(req.params.websiteId), severity as string | undefined);
    res.json({ issues, total: issues.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/websites/:websiteId/crawl/summary
 * Aggregate metrics of crawl run
 */
crawlerRouter.get('/websites/:websiteId/crawl/summary', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const summary = await CrawlerService.getCrawlSummary(req.tenantId!, String(req.params.websiteId));
    res.json(summary);
  } catch (err) {
    next(err);
  }
});
