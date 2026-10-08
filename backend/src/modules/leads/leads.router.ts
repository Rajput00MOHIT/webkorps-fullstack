import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import type { TenantRequest } from '../../middleware/tenantContext.js';
import { requireAuth } from '../../middleware/auth.js';
import { LeadService } from './leadService.js';

export const leadsRouter = Router();

import jwt from "jsonwebtoken";
import { ENV } from "../../config/env.js";

function getTenantId(req: TenantRequest): string {
  if (req.header("X-Tenant-ID")) {
    return req.header("X-Tenant-ID")!.trim();
  }
  const authHeader = req.header("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
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
 * POST /api/v1/leads
 * Lead submission endpoint (compatible with Website ContactForm and API calls)
 */
leadsRouter.post('/', async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const { fullName, email, phone, message, company, jobTitle, country, websiteId, source, metadata } = req.body;

    const lead = await LeadService.createLead({
      organizationId: orgId,
      websiteId,
      fullName: fullName || `${req.body.firstName || ''} ${req.body.lastName || ''}`.trim(),
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email,
      phone,
      company,
      jobTitle,
      country,
      message,
      source: source || 'CONTACT_FORM',
      metadata
    });

    res.status(201).json({
      success: true,
      leadId: lead.id,
      lead,
      message: 'Thank you for reaching out. A Webkorps engineering leader will contact you within 24 hours.'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/leads/capture
 * Assistant-to-Lead handoff capture
 */
leadsRouter.post('/capture', async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const { conversationId, fullName, email, phone, company, jobTitle, message, websiteId } = req.body;

    if (!conversationId) {
      res.status(400).json({ error: { message: 'conversationId is required for assistant capture.' } });
      return;
    }

    const lead = await LeadService.captureFromAssistant({
      organizationId: orgId,
      conversationId,
      fullName,
      email,
      phone,
      company,
      jobTitle,
      message,
      websiteId
    });

    res.status(201).json({
      success: true,
      leadId: lead.id,
      lead
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/leads
 * Retrieves leads strictly isolated by organization_id with filters
 */
leadsRouter.get('/', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const status = req.query.status as any;
    const priority = req.query.priority as any;
    const source = req.query.source as any;
    const assignedTo = req.query.assignedTo as string;
    const search = req.query.search as string;
    const limit = parseInt(req.query.limit as string || '50', 10);
    const offset = parseInt(req.query.offset as string || '0', 10);

    const result = await LeadService.getLeads(orgId, {
      status,
      priority,
      source,
      assignedTo,
      search,
      limit,
      offset
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/leads/:id
 */
leadsRouter.get('/:id', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const lead = await LeadService.getLeadById(orgId, req.params.id as string);
    res.json(lead);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/leads/:id/score
 */
leadsRouter.get('/:id/score', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const lead = await LeadService.getLeadById(orgId, req.params.id as string);
    res.json({
      leadId: lead.id,
      score: lead.score,
      scoreCategory: lead.score_category,
      priority: lead.priority,
      scoreReasons: lead.score_reasons,
      qualification: lead.qualification,
      scoreBreakdown: lead.metadata?.scoreBreakdown || {}
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/leads/:id/status
 */
leadsRouter.patch('/:id/status', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const { status, notes } = req.body;
    if (!status) {
      res.status(400).json({ error: { message: 'status field is required.' } });
      return;
    }

    const updated = await LeadService.updateLeadStatus(
      orgId,
      req.params.id as string,
      status,
      (req as any).user?.id,
      notes
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/leads/:id/assign
 */
leadsRouter.post('/:id/assign', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const { assignedToUserId } = req.body;
    if (!assignedToUserId) {
      res.status(400).json({ error: { message: 'assignedToUserId is required.' } });
      return;
    }

    const updated = await LeadService.assignLead(
      orgId,
      req.params.id as string,
      assignedToUserId,
      (req as any).user?.id
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/leads/:id/notes & POST /api/v1/leads/:id/notes
 */
leadsRouter.get('/:id/notes', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const notes = await LeadService.getNotes(orgId, req.params.id as string);
    res.json({ notes, total: notes.length });
  } catch (err) {
    next(err);
  }
});

leadsRouter.post('/:id/notes', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const { content } = req.body;
    const note = await LeadService.addNote(
      orgId,
      req.params.id as string,
      content,
      (req as any).user?.id
    );
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/leads/:id/activities & POST /api/v1/leads/:id/activities
 */
leadsRouter.get('/:id/activities', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const activities = await LeadService.getActivities(orgId, req.params.id as string);
    res.json({ activities, total: activities.length });
  } catch (err) {
    next(err);
  }
});

leadsRouter.post('/:id/activities', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const { type, title, description, scheduledAt, completedAt, metadata } = req.body;
    if (!type || !title) {
      res.status(400).json({ error: { message: 'type and title are required.' } });
      return;
    }

    const activity = await LeadService.addActivity(orgId, req.params.id as string, {
      type,
      title,
      description,
      createdBy: (req as any).user?.id,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      completedAt: completedAt ? new Date(completedAt) : undefined,
      metadata
    });
    res.status(201).json(activity);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/leads/:id/timeline
 */
leadsRouter.get('/:id/timeline', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const timeline = await LeadService.getTimeline(orgId, req.params.id as string);
    res.json({ timeline, total: timeline.length });
  } catch (err) {
    next(err);
  }
});
