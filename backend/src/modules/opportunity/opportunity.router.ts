import { Router } from 'express';
import type { Response } from 'express';
import type { TenantRequest } from '../../middleware/tenantContext.js';
import { requireAuth } from '../../middleware/auth.js';
import { OpportunityService } from './opportunityService.js';

export const opportunityRouter = Router();

/**
 * GET /api/v1/opportunities
 * List opportunities for tenant with optional filters
 */
opportunityRouter.get('/', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const status = req.query.status as any;
    const priority = req.query.priority as any;
    const opportunityType = req.query.opportunityType as any;
    const competitorId = req.query.competitorId as string;

    const opportunities = await OpportunityService.getOpportunities((req.tenantId || (req as any).organizationId)!, {
      status,
      priority,
      opportunityType,
      competitorId
    });
    res.json({ opportunities, total: opportunities.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/opportunities/summary
 * Summary metrics of opportunities across priorities and types
 */
opportunityRouter.get('/summary', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const summary = await OpportunityService.getSummary((req.tenantId || (req as any).organizationId)!);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/opportunities/generate
 * Trigger hybrid opportunity evaluation across KG, crawl, research & AI observations
 */
opportunityRouter.post('/generate', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const opportunities = await OpportunityService.generateOpportunities((req.tenantId || (req as any).organizationId)!);
    res.status(200).json({
      opportunities,
      total: opportunities.length,
      message: `Successfully evaluated and synchronized ${opportunities.length} opportunities.`
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/opportunities/:id
 * Get single opportunity with attached evidence
 */
opportunityRouter.get('/:id', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const opp = await OpportunityService.getOpportunityById((req.tenantId || (req as any).organizationId)!, (req.params.id as string));
    res.json(opp);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/opportunities/:id/evidence
 * Get evidence records linked to this opportunity
 */
opportunityRouter.get('/:id/evidence', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const evidence = await OpportunityService.getOpportunityEvidence((req.tenantId || (req as any).organizationId)!, (req.params.id as string));
    res.json({ evidence, total: evidence.length });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/opportunities/:id/status
 * Update opportunity workflow status
 */
opportunityRouter.patch('/:id/status', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: 'Status is required.' });
      return;
    }
    const updated = await OpportunityService.updateOpportunityStatus((req.tenantId || (req as any).organizationId)!, (req.params.id as string), status);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/opportunities/:id/status
 * Update opportunity workflow status (alias)
 */
opportunityRouter.put('/:id/status', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: 'Status is required.' });
      return;
    }
    const updated = await OpportunityService.updateOpportunityStatus((req.tenantId || (req as any).organizationId)!, (req.params.id as string), status);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});
