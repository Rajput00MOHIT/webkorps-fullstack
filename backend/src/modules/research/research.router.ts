import { Router } from 'express';
import type { Response } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import type { TenantRequest } from '../../middleware/tenantContext.js';
import { ResearchService } from './researchService.js';
import { QueryRouter } from '../queryRouter/queryRouter.js';

export const researchRouter = Router();

/**
 * POST /api/v1/research
 * Asynchronously queues a research task and returns 202 Accepted
 */
researchRouter.post('/', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const { query, route, limit } = req.body;
    if (!query) {
      res.status(400).json({ error: { message: 'query is required.' } });
      return;
    }

    const result = await ResearchService.queueResearch({
      organizationId: req.tenantId!,
      userId: req.user?.id,
      query: String(query),
      route,
      limit: limit ? parseInt(String(limit), 10) : undefined
    });

    res.status(202).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/research/route
 * Lightweight endpoint to evaluate routing decision without starting research
 */
researchRouter.get('/route', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const query = String(req.query.q || '');
    if (!query) {
      res.status(400).json({ error: { message: 'Query parameter q is required.' } });
      return;
    }
    const decision = QueryRouter.route(query);
    res.json(decision);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/research/:id
 * Retrieve session status and metadata
 */
researchRouter.get('/:id', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const session = await ResearchService.getSession(req.tenantId!, String(req.params.id));
    res.json(session);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/research/:id/sources
 * Retrieve sources for a session
 */
researchRouter.get('/:id/sources', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const sources = await ResearchService.getSessionSources(req.tenantId!, String(req.params.id));
    res.json({ sources, total: sources.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/research/:id/evidence
 * Retrieve evidence passages for a session
 */
researchRouter.get('/:id/evidence', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const evidence = await ResearchService.getSessionEvidence(req.tenantId!, String(req.params.id));
    res.json({ evidence, total: evidence.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/research
 * List historical research sessions
 */
researchRouter.get('/', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const { route, status, page, limit } = req.query;
    const sessions = await ResearchService.listSessions(req.tenantId!, {
      route: route as string | undefined,
      status: status as string | undefined,
      page: page ? parseInt(String(page), 10) : undefined,
      limit: limit ? parseInt(String(limit), 10) : undefined
    });
    res.json({ sessions, total: sessions.length });
  } catch (err) {
    next(err);
  }
});
