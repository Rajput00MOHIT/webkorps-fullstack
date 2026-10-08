import { Router } from 'express';
import type { Response } from 'express';
import type { TenantRequest } from '../../middleware/tenantContext.js';
import { requireAuth } from '../../middleware/auth.js';
import { CompetitorService } from './competitorService.js';
import { CompetitorDiscovery } from './competitorDiscovery.js';
import { CompetitorProfileService } from './competitorProfileService.js';
import { CompetitorComparisonService } from './competitorComparisonService.js';

export const competitorRouter = Router();

/**
 * GET /api/v1/competitors
 * List all competitors for tenant with optional filters
 */
competitorRouter.get('/', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const status = req.query.status as any;
    const search = req.query.search as string;
    const competitors = await CompetitorService.getCompetitors((req.tenantId || (req as any).organizationId)!, { status, search });
    res.json({ competitors, total: competitors.length });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/competitors
 * Create or register a competitor
 */
competitorRouter.post('/', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const { name, domain, url, description, coreCapabilities, source, status, confidence, metadata } = req.body;
    const competitor = await CompetitorService.createCompetitor({
      organizationId: (req.tenantId || (req as any).organizationId)!,
      name,
      domain,
      url,
      description,
      coreCapabilities,
      source,
      status,
      confidence,
      metadata
    });
    res.status(201).json(competitor);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/competitors/discover
 * Discover competitor candidates across AI visibility, citations, and research
 */
competitorRouter.post('/discover', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const autoRegister = req.body.autoRegister === true;
    const candidates = await CompetitorDiscovery.discoverCompetitors((req.tenantId || (req as any).organizationId)!);
    
    let registeredCount = 0;
    if (autoRegister) {
      registeredCount = await CompetitorDiscovery.autoRegisterDiscoveredCompetitors((req.tenantId || (req as any).organizationId)!);
    }

    res.json({
      candidates,
      total: candidates.length,
      autoRegistered: registeredCount
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/competitors/:id
 * Get single competitor details
 */
competitorRouter.get('/:id', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const competitor = await CompetitorService.getCompetitorById((req.tenantId || (req as any).organizationId)!, (req.params.id as string));
    res.json(competitor);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/competitors/:id
 * Update competitor details
 */
competitorRouter.patch('/:id', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const updated = await CompetitorService.updateCompetitor((req.tenantId || (req as any).organizationId)!, (req.params.id as string), req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/competitors/:id
 * Update competitor details (alias)
 */
competitorRouter.put('/:id', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const updated = await CompetitorService.updateCompetitor((req.tenantId || (req as any).organizationId)!, (req.params.id as string), req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/competitors/:id
 * Delete a competitor
 */
competitorRouter.delete('/:id', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    await CompetitorService.deleteCompetitor((req.tenantId || (req as any).organizationId)!, (req.params.id as string));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/competitors/:id/profile
 * Get aggregated intelligence profile for competitor
 */
competitorRouter.get('/:id/profile', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const profile = await CompetitorProfileService.getProfile((req.tenantId || (req as any).organizationId)!, (req.params.id as string));
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/competitors/:id/crawl
 * Queue crawl for competitor website
 */
competitorRouter.post('/:id/crawl', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const { maxPages, scope, renderJavascript } = req.body;
    const crawlRun = await CompetitorService.crawlCompetitor((req.tenantId || (req as any).organizationId)!, (req.params.id as string), {
      maxPages,
      scope,
      renderJavascript
    });
    res.status(202).json(crawlRun);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/competitors/:id/visibility
 * Compare AI visibility between competitor and organization
 */
competitorRouter.get('/:id/visibility', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const comparison = await CompetitorComparisonService.getVisibilityComparison((req.tenantId || (req as any).organizationId)!, (req.params.id as string));
    res.json(comparison);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/competitors/:id/comparison
 * Full comparison: Services, Technical SEO, AI Visibility, Gaps
 */
competitorRouter.get('/:id/comparison', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const comparison = await CompetitorComparisonService.getFullComparison((req.tenantId || (req as any).organizationId)!, (req.params.id as string));
    res.json(comparison);
  } catch (err) {
    next(err);
  }
});
