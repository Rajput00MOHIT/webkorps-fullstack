import { Router } from 'express';
import type { Response } from 'express';
import type { TenantRequest } from '../../middleware/tenantContext.js';
import { requireAuth } from '../../middleware/auth.js';
import { GEOService } from './geoService.js';

export const geoRouter = Router();

/**
 * GET /api/v1/geo/engines
 * List supported/active AI Engines
 */
geoRouter.get('/engines', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const engines = await GEOService.getEngines();
    res.json({ engines, total: engines.length });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/geo/prompts
 * Create a new visibility prompt to monitor
 */
geoRouter.post('/prompts', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const { promptText, category, language, region, targetEntity } = req.body;
    if (!promptText) {
      res.status(400).json({ error: { message: 'promptText is required.' } });
      return;
    }

    const prompt = await GEOService.createPrompt({
      organizationId: req.tenantId!,
      promptText,
      category,
      language,
      region,
      targetEntity
    });

    res.status(201).json(prompt);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/geo/prompts
 * List visibility prompts for tenant
 */
geoRouter.get('/prompts', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const { category } = req.query;
    const prompts = await GEOService.getPrompts(req.tenantId!, category as string | undefined);
    res.json({ prompts, total: prompts.length });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/geo/prompts/generate
 * Generate candidate visibility prompts based on company profile & knowledge graph
 */
geoRouter.post('/prompts/generate', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const candidates = await GEOService.generateCandidatePrompts(req.tenantId!);
    res.json({ candidates, total: candidates.length });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/geo/observations
 * Trigger an automated AI observation run for a prompt
 */
geoRouter.post('/observations', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const { promptId, engineId, competitors } = req.body;
    if (!promptId) {
      res.status(400).json({ error: { message: 'promptId is required.' } });
      return;
    }

    const run = await GEOService.queueObservationRun({
      organizationId: req.tenantId!,
      promptId,
      engineId,
      competitors
    });

    res.status(202).json(run);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/geo/observations/import
 * Ingest real manual observations from ChatGPT, Perplexity, or Gemini
 */
geoRouter.post('/observations/import', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const { engine, model, prompt, response, competitors, targetEntity, observedAt } = req.body;
    if (!prompt || !response) {
      res.status(400).json({ error: { message: 'prompt and response are required.' } });
      return;
    }

    const result = await GEOService.importObservation({
      organizationId: req.tenantId!,
      engineName: engine || 'ChatGPT',
      model,
      promptText: prompt,
      rawResponse: response,
      competitors,
      targetEntity,
      observedAt
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/geo/observations
 * List observation runs
 */
geoRouter.get('/observations', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const runs = await GEOService.getObservations(req.tenantId!);
    res.json({ observations: runs, total: runs.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/geo/mentions
 * List brand mentions
 */
geoRouter.get('/mentions', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const mentions = await GEOService.getMentions(req.tenantId!);
    res.json({ mentions, total: mentions.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/geo/citations
 * List citations extracted from AI observations
 */
geoRouter.get('/citations', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const citations = await GEOService.getCitations(req.tenantId!);
    res.json({ citations, total: citations.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/geo/competitors
 * List competitor mentions discovered across AI observations
 */
geoRouter.get('/competitors', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const competitors = await GEOService.getCompetitors(req.tenantId!);
    res.json({ competitors, total: competitors.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/geo/opportunities
 * List identified GEO opportunities and action items
 */
geoRouter.get('/opportunities', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const opportunities = await GEOService.getOpportunities(req.tenantId!);
    res.json({ opportunities, total: opportunities.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/geo/summary
 * Compute empirical GEO visibility metrics (mention rate, citation rate, etc.)
 */
geoRouter.get('/summary', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const summary = await GEOService.getSummary(req.tenantId!);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});
