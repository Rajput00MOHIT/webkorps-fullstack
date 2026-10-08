import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../../config/env.js';
import type { TenantRequest } from '../../middleware/tenantContext.js';
import { requireAuth } from '../../middleware/auth.js';
import { db } from '../../db/client.js';
import { AnalyticsService } from './analyticsService.js';

export const analyticsRouter = Router();

function getTenantId(req: TenantRequest): string {
  if (req.header('X-Tenant-ID')) {
    return req.header('X-Tenant-ID')!.trim();
  }
  const authHeader = req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.substring(7).trim(), ENV.JWT_SECRET) as any;
      if (decoded.organizationId) return decoded.organizationId;
    } catch {
      // fallback
    }
  }
  return req.tenantId || (req as any).organizationId || ENV.DEFAULT_TENANT_ID;
}

/**
 * POST /api/v1/analytics/events
 * Consumes events emitted by client analytics into PostgreSQL
 */
analyticsRouter.post('/events', async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const { eventName, category, label, metadata, timestamp, websiteId, entityType, entityId, source } = req.body;
    
    await db.query(
      `INSERT INTO analytics_events (
         organization_id, event_name, category, label, metadata, timestamp, website_id, entity_type, entity_id, source
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        orgId,
        eventName || 'unknown',
        category || 'engagement',
        label || null,
        JSON.stringify(metadata || {}),
        timestamp || Date.now(),
        websiteId || null,
        entityType || null,
        entityId || null,
        source || 'WEB'
      ]
    );

    res.status(202).json({ status: 'accepted' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/analytics/events
 * List recent events
 */
analyticsRouter.get('/events', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const limit = parseInt(req.query.limit as string || '50', 10);
    const resDb = await db.query(
      `SELECT * FROM analytics_events WHERE organization_id = $1 ORDER BY timestamp DESC LIMIT $2`,
      [orgId, limit]
    );
    res.json({ events: resDb.rows, total: resDb.rows.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/analytics/overview
 * Executive Growth Overview
 */
analyticsRouter.get('/overview', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const range = AnalyticsService.parseDateRange(
      req.query.period as string,
      req.query.startDate as string,
      req.query.endDate as string
    );
    const snapshot = await AnalyticsService.getGrowthSnapshot(orgId, range);
    res.json({
      organization: snapshot.organization,
      timeWindow: snapshot.timeWindow,
      kpiSummary: snapshot.kpiSummary,
      diagnoses: snapshot.diagnoses,
      topActions: snapshot.topActions,
      dataFreshness: snapshot.dataFreshness
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/analytics/snapshot
 * Complete Growth Operating System Snapshot
 */
analyticsRouter.get('/snapshot', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const range = AnalyticsService.parseDateRange(
      req.query.period as string,
      req.query.startDate as string,
      req.query.endDate as string
    );
    const snapshot = await AnalyticsService.getGrowthSnapshot(orgId, range);
    res.json(snapshot);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/analytics/website
 * Website crawl & indexability health
 */
analyticsRouter.get('/website', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const websiteId = req.query.websiteId as string;
    const analytics = await AnalyticsService.getWebsiteAnalytics(orgId, websiteId);
    res.json(analytics);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/analytics/seo
 * Technical SEO issue distribution & trends
 */
analyticsRouter.get('/seo', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const websiteId = req.query.websiteId as string;
    const range = AnalyticsService.parseDateRange(
      req.query.period as string,
      req.query.startDate as string,
      req.query.endDate as string
    );
    const analytics = await AnalyticsService.getSEOAnalytics(orgId, range, websiteId);
    res.json(analytics);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/analytics/geo
 * AI Visibility, mention rate, citation rate & recommendation rates
 */
analyticsRouter.get('/geo', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const range = AnalyticsService.parseDateRange(
      req.query.period as string,
      req.query.startDate as string,
      req.query.endDate as string
    );
    const analytics = await AnalyticsService.getGEOAnalytics(orgId, range);
    res.json(analytics);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/analytics/competitors
 * Competitor intelligence, share of voice & gaps
 */
analyticsRouter.get('/competitors', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const analytics = await AnalyticsService.getCompetitorAnalytics(orgId);
    res.json(analytics);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/analytics/opportunities
 * Opportunity backlog, priority breakdown, and impact/effort
 */
analyticsRouter.get('/opportunities', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const analytics = await AnalyticsService.getOpportunityAnalytics(orgId);
    res.json(analytics);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/analytics/content
 * Content projects, approval rates & fact validation
 */
analyticsRouter.get('/content', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const analytics = await AnalyticsService.getContentAnalytics(orgId);
    res.json(analytics);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/analytics/assistant
 * Assistant conversations, query volume & lead intent funnel
 */
analyticsRouter.get('/assistant', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const range = AnalyticsService.parseDateRange(
      req.query.period as string,
      req.query.startDate as string,
      req.query.endDate as string
    );
    const analytics = await AnalyticsService.getAssistantAnalytics(orgId, range);
    res.json(analytics);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/analytics/leads
 * Lead pipeline, lifecycle breakdown & acquisition source performance
 */
analyticsRouter.get('/leads', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const range = AnalyticsService.parseDateRange(
      req.query.period as string,
      req.query.startDate as string,
      req.query.endDate as string
    );
    const analytics = await AnalyticsService.getLeadAnalytics(orgId, range);
    res.json(analytics);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/analytics/trends
 * Consolidated historical trends across SEO, GEO, and Leads
 */
analyticsRouter.get('/trends', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const range = AnalyticsService.parseDateRange(
      req.query.period as string,
      req.query.startDate as string,
      req.query.endDate as string
    );
    const [seo, geo, leads] = await Promise.all([
      AnalyticsService.getSEOAnalytics(orgId, range),
      AnalyticsService.getGEOAnalytics(orgId, range),
      AnalyticsService.getLeadAnalytics(orgId, range)
    ]);

    res.json({
      period: range.periodName,
      startDate: range.startDate.toISOString(),
      endDate: range.endDate.toISOString(),
      seoTrend: seo.trend,
      geoMentionTrend: geo.targetBrandMentionRate.trend,
      geoRecommendationTrend: geo.recommendationRate.trend,
      totalLeads: leads.totalLeads,
      conversionRate: leads.overallConversionRate.ratePercentage
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/analytics/actions
 * Prioritized Action Queue
 */
analyticsRouter.get('/actions', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const status = req.query.status as string;
    const actions = await AnalyticsService.getGrowthActions(orgId, status);
    res.json({ actions, total: actions.length });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/analytics/actions/:id/status
 * Update action status
 */
analyticsRouter.patch('/actions/:id/status', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const { status } = req.body;
    const updated = await AnalyticsService.updateActionStatus(orgId, req.params.id as string, status, req.user?.id);
    res.json({ success: true, action: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/analytics/diagnosis
 * Deterministic Growth Diagnosis Engine
 */
analyticsRouter.get('/diagnosis', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const range = AnalyticsService.parseDateRange(
      req.query.period as string,
      req.query.startDate as string,
      req.query.endDate as string
    );
    const diagnoses = await AnalyticsService.getGrowthDiagnosis(orgId, range);
    res.json({ diagnoses, total: diagnoses.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/analytics/ai-usage
 * AI usage and cost monitoring
 */
analyticsRouter.get('/ai-usage', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const usage = await AnalyticsService.getAIUsageAnalytics(orgId);
    res.json(usage);
  } catch (err) {
    next(err);
  }
});
