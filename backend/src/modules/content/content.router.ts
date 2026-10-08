import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import type { TenantRequest } from '../../middleware/tenantContext.js';
import { requireAuth } from '../../middleware/auth.js';
import { ContentProjectService } from './contentProjectService.js';
import { ContentBriefService } from './contentBriefService.js';
import { ContentDraftService } from './contentDraftService.js';
import { ContentValidationService } from './contentValidationService.js';
import { ContentReviewService } from './contentReviewService.js';

export const contentRouter = Router();

const SEED_ARTICLES = [
  {
    id: 'blog-industrial-iot',
    date: '2026-08-19',
    displayDate: 'August 19, 2026',
    category: 'AI-ML Development',
    title: 'Industrial IoT Pilots Are Failing. Here Is Where',
    image: '/assets/Blog/image 368.png',
    imageAlt: 'Laptop interface showing industrial IoT network diagnostic dashboard',
    href: '#insights'
  },
  {
    id: 'blog-power-bi-consulting',
    date: '2026-06-23',
    displayDate: 'June 23, 2026',
    category: 'Technology',
    title: 'Power BI Consulting for Digital Transformation',
    image: '/assets/Blog/image 369.png',
    imageAlt: 'Laptop display showing real-time Power BI revenue and business intelligence dashboard',
    href: '#insights'
  }
];

/**
 * GET /api/v1/content/insights
 * Serves blog posts matching frontend BlogPost contract
 */
contentRouter.get('/insights', (req: TenantRequest, res: Response) => {
  res.json({
    items: SEED_ARTICLES,
    total: SEED_ARTICLES.length
  });
});

// Helper to get tenant ID
function getTenantId(req: TenantRequest): string {
  return (req.tenantId || (req as any).organizationId)!;
}

// ==========================================
// 1. CONTENT PROJECTS
// ==========================================

/**
 * GET /api/v1/content/projects
 * List all content projects for the tenant
 */
contentRouter.get('/projects', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const status = req.query.status as any;
    const contentType = req.query.contentType as any;
    const projects = await ContentProjectService.getProjects(orgId, { status, contentType });
    res.json({ projects, total: projects.length });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/content/projects
 * Create a new tenant-aware content project (optionally consuming a Phase 5 opportunity)
 */
contentRouter.get('/projects/:id', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const project = await ContentProjectService.getProjectById(orgId, req.params.id as string);
    res.json(project);
  } catch (err) {
    next(err);
  }
});

contentRouter.post('/projects', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const project = await ContentProjectService.createProject({
      organizationId: orgId,
      websiteId: req.body.websiteId,
      opportunityId: req.body.opportunityId,
      title: req.body.title,
      topic: req.body.topic,
      contentType: req.body.contentType,
      targetKeyword: req.body.targetKeyword,
      searchIntent: req.body.searchIntent,
      audience: req.body.audience,
      language: req.body.language,
      metadata: req.body.metadata
    });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/content/projects/:id
 */
contentRouter.patch('/projects/:id', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const updated = await ContentProjectService.updateProject(orgId, req.params.id as string, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/content/projects/:id
 */
contentRouter.delete('/projects/:id', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    await ContentProjectService.deleteProject(orgId, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 2. CONTENT BRIEFS
// ==========================================

/**
 * GET /api/v1/content/briefs
 */
contentRouter.get('/briefs', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const projectId = req.query.projectId as string;
    if (!projectId) {
      res.status(400).json({ error: 'Query parameter projectId is required.' });
      return;
    }
    const brief = await ContentBriefService.getBriefByProjectId(orgId, projectId);
    res.json(brief);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/content/briefs/:id
 */
contentRouter.get('/briefs/:id', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const brief = await ContentBriefService.getBriefById(orgId, req.params.id as string);
    res.json(brief);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/content/briefs/generate
 * Synthesizes grounded evidence (KG + Crawl Pages + Competitor Gaps + Research) into an actionable brief
 */
contentRouter.post('/briefs/generate', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const { projectId, contentGoal, customAudience } = req.body;
    if (!projectId) {
      res.status(400).json({ error: 'Field projectId is required.' });
      return;
    }
    const brief = await ContentBriefService.generateBrief({
      organizationId: orgId,
      contentProjectId: projectId,
      contentGoal,
      customAudience
    });
    res.status(201).json(brief);
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 3. CONTENT DRAFTS
// ==========================================

/**
 * GET /api/v1/content/drafts
 */
contentRouter.get('/drafts', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const projectId = req.query.projectId as string | undefined;
    const drafts = await ContentDraftService.getDrafts(orgId, projectId);
    res.json({ drafts, total: drafts.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/content/drafts/:id
 */
contentRouter.get('/drafts/:id', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const draft = await ContentDraftService.getDraftById(orgId, req.params.id as string);
    res.json(draft);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/content/drafts/generate
 */
contentRouter.post('/drafts/generate', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const { projectId, providerName, allowLocalTemplateFallback, format } = req.body;
    if (!projectId) {
      res.status(400).json({ error: 'Field projectId is required.' });
      return;
    }
    const draft = await ContentDraftService.generateDraft({
      organizationId: orgId,
      projectId,
      providerName,
      allowLocalTemplateFallback,
      format
    });
    res.status(201).json(draft);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/content/drafts/:id
 */
contentRouter.patch('/drafts/:id', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const updated = await ContentDraftService.updateDraft(orgId, req.params.id as string, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 4. CONTENT VALIDATIONS (Fact-Check, SEO, GEO, Duplicate)
// ==========================================

/**
 * GET /api/v1/content/validation/:draftId
 */
contentRouter.get('/validation/:draftId', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const validations = await ContentValidationService.getValidationResults(orgId, req.params.draftId as string);
    res.json({ validations, total: validations.length });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/content/validation/:draftId/run
 */
contentRouter.post('/validation/:draftId/run', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const validations = await ContentValidationService.runAllValidations(orgId, req.params.draftId as string);
    res.json({ validations, total: validations.length });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 5. HUMAN REVIEWS (NO AUTOMATIC PUBLISHING)
// ==========================================

/**
 * GET /api/v1/content/reviews/:draftId
 */
contentRouter.get('/reviews/:draftId', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const reviews = await ContentReviewService.getReviews(orgId, req.params.draftId as string);
    res.json({ reviews, total: reviews.length });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/content/reviews
 */
contentRouter.post('/reviews', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const { draftId, decision, reviewerName, comments, flags, metadata } = req.body;
    if (!draftId || !decision) {
      res.status(400).json({ error: 'Fields draftId and decision are required.' });
      return;
    }
    const review = await ContentReviewService.submitReview(orgId, draftId, {
      decision,
      reviewerName,
      comments,
      flags,
      metadata
    });
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
});
