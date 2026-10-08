import { db } from '../../db/client.js';
import { AuditLogger } from '../audit/auditLogger.js';
import { LeadScorer } from './leadScorer.js';
import createHttpError from 'http-errors';
import type {
  Lead,
  LeadSource,
  LeadStatus,
  LeadPriority,
  LeadActivity,
  LeadNote,
  LeadTimelineEvent,
  ActivityType
} from './leadTypes.js';

export interface CreateLeadInput {
  organizationId: string;
  websiteId?: string;
  conversationId?: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  country?: string;
  message: string;
  source?: LeadSource;
  consentGiven?: boolean;
  metadata?: Record<string, any>;
}

export interface LeadFilterOptions {
  status?: LeadStatus;
  priority?: LeadPriority;
  assignedTo?: string;
  source?: LeadSource;
  search?: string;
  limit?: number;
  offset?: number;
}

export class LeadService {
  /**
   * Creates and scores a tenant-isolated lead from a form, assistant, or manual entry.
   */
  public static async createLead(input: CreateLeadInput): Promise<Lead> {
    const { organizationId, fullName, email, phone, message } = input;

    if (!fullName || !fullName.trim()) {
      throw createHttpError(400, 'Full name is required.');
    }
    if (!email || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw createHttpError(400, 'A valid business or personal email address is required.');
    }
    if (!message || !message.trim()) {
      throw createHttpError(400, 'Project requirement message is required.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = (phone || '').trim();
    const cleanName = fullName.trim();
    const cleanCompany = (input.company || '').trim();

    // 1. Duplicate Lead Detection
    const dupRes = await db.query(
      `SELECT id, status, created_at FROM leads
       WHERE organization_id = $1 AND (email = $2 OR (phone = $3 AND phone != ''))
       ORDER BY created_at DESC LIMIT 1`,
      [organizationId, cleanEmail, cleanPhone]
    );

    const isDuplicate = dupRes.rows.length > 0;
    const existingLead = dupRes.rows[0];

    // 2. Knowledge Graph Service Matching
    const serviceRes = await db.query(
      `SELECT id, name FROM knowledge_entities WHERE organization_id = $1 AND entity_type = 'SERVICE'`,
      [organizationId]
    );

    let matchedService: { id: string; name: string } | undefined;
    const msgLower = message.toLowerCase();
    for (const s of serviceRes.rows) {
      if (msgLower.includes(s.name.toLowerCase())) {
        matchedService = s;
        break;
      }
    }

    // 3. Conversation Context & Turns (if originated from assistant)
    let turnsCount = 1;
    let assistantIntentLevel = 'NONE';
    if (input.conversationId) {
      const convRes = await db.query(
        `SELECT state FROM conversations WHERE id = $1 AND organization_id = $2`,
        [input.conversationId, organizationId]
      );
      if (convRes.rows.length === 0) {
        throw createHttpError(404, 'Originating assistant conversation not found in this organization.');
      }
      const msgCountRes = await db.query(
        `SELECT count(*) as count FROM messages WHERE conversation_id = $1 AND organization_id = $2`,
        [input.conversationId, organizationId]
      );
      turnsCount = parseInt(msgCountRes.rows[0]?.count || '1', 10);
      assistantIntentLevel = convRes.rows[0]?.state?.lastLeadIntent?.level || 'HIGH';
    }

    // 4. Deterministic Scoring & Qualification
    const { qualification, scoreBreakdown } = LeadScorer.evaluate({
      message: input.message,
      email: cleanEmail,
      phone: cleanPhone,
      company: cleanCompany,
      jobTitle: input.jobTitle,
      leadIntentLevel: assistantIntentLevel,
      matchedServiceName: matchedService?.name,
      matchedServiceId: matchedService?.id,
      conversationTurnsCount: turnsCount
    });

    const consentMetadata = {
      consentGiven: input.consentGiven ?? true,
      timestamp: new Date().toISOString(),
      source: input.source || 'WEBSITE_FORM'
    };

    const leadMeta = {
      ...(input.metadata || {}),
      duplicateWarning: isDuplicate ? `Possible duplicate of existing lead ${existingLead.id}` : undefined,
      scoreBreakdown: scoreBreakdown.dimensions
    };

    // 5. Insert Lead into Database
    const insertRes = await db.query(
      `INSERT INTO leads (
        organization_id, website_id, conversation_id, full_name, first_name, last_name,
        email, phone, company, job_title, country, message, source, status, score,
        score_category, score_reasons, priority, matched_service_id, qualification,
        consent_metadata, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'NEW', $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        organizationId,
        input.websiteId || null,
        input.conversationId || null,
        cleanName,
        input.firstName || cleanName.split(' ')[0] || null,
        input.lastName || cleanName.split(' ').slice(1).join(' ') || null,
        cleanEmail,
        cleanPhone || 'N/A',
        cleanCompany || null,
        input.jobTitle || null,
        input.country || null,
        input.message.trim(),
        input.source || (input.conversationId ? 'AI_ASSISTANT' : 'CONTACT_FORM'),
        scoreBreakdown.score,
        scoreBreakdown.scoreCategory,
        scoreBreakdown.reasons,
        scoreBreakdown.priority,
        matchedService?.id || null,
        JSON.stringify(qualification),
        JSON.stringify(consentMetadata),
        JSON.stringify(leadMeta)
      ]
    );

    const createdLead = insertRes.rows[0];

    // 6. Automatically log initial CRM activity
    await db.query(
      `INSERT INTO lead_activities (organization_id, lead_id, type, title, description, metadata)
       VALUES ($1, $2, 'STATUS_CHANGE', 'Lead Created', $3, $4)`,
      [
        organizationId,
        createdLead.id,
        `Lead created via ${createdLead.source} with score ${scoreBreakdown.score} (${scoreBreakdown.priority})`,
        JSON.stringify({ score: scoreBreakdown.score, priority: scoreBreakdown.priority })
      ]
    );

    // 7. Audit Log
    await AuditLogger.log({
      organizationId,
      action: 'LEAD_CREATED',
      entityType: 'LEAD',
      entityId: createdLead.id,
      details: {
        email: cleanEmail,
        source: createdLead.source,
        score: scoreBreakdown.score,
        priority: scoreBreakdown.priority
      }
    });

    return createdLead;
  }

  /**
   * Assistant-to-Lead handoff capture endpoint.
   */
  public static async captureFromAssistant(input: {
    organizationId: string;
    conversationId: string;
    fullName: string;
    email: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    message: string;
    websiteId?: string;
  }): Promise<Lead> {
    return this.createLead({
      ...input,
      source: 'AI_ASSISTANT',
      consentGiven: true
    });
  }

  public static async getLeads(organizationId: string, filters: LeadFilterOptions = {}): Promise<{ leads: Lead[]; total: number }> {
    let sql = `SELECT l.*, u.full_name as assigned_to_name, k.name as matched_service_name
               FROM leads l
               LEFT JOIN users u ON u.id = l.assigned_to_user_id
               LEFT JOIN knowledge_entities k ON k.id = l.matched_service_id
               WHERE l.organization_id = $1`;
    const params: any[] = [organizationId];
    let paramIdx = 2;

    if (filters.status) {
      sql += ` AND l.status = $${paramIdx++}`;
      params.push(filters.status);
    }
    if (filters.priority) {
      sql += ` AND l.priority = $${paramIdx++}`;
      params.push(filters.priority);
    }
    if (filters.source) {
      sql += ` AND l.source = $${paramIdx++}`;
      params.push(filters.source);
    }
    if (filters.assignedTo) {
      sql += ` AND l.assigned_to_user_id = $${paramIdx++}`;
      params.push(filters.assignedTo);
    }
    if (filters.search) {
      sql += ` AND (l.full_name ILIKE $${paramIdx} OR l.email ILIKE $${paramIdx} OR l.company ILIKE $${paramIdx})`;
      params.push(`%${filters.search}%`);
      paramIdx++;
    }

    sql += ` ORDER BY l.created_at DESC`;

    if (filters.limit) {
      sql += ` LIMIT $${paramIdx++}`;
      params.push(filters.limit);
    }
    if (filters.offset) {
      sql += ` OFFSET $${paramIdx++}`;
      params.push(filters.offset);
    }

    const res = await db.query(sql, params);
    return { leads: res.rows, total: res.rows.length };
  }

  public static async getLeadById(organizationId: string, leadId: string): Promise<Lead> {
    const res = await db.query(
      `SELECT l.*, u.full_name as assigned_to_name, k.name as matched_service_name
       FROM leads l
       LEFT JOIN users u ON u.id = l.assigned_to_user_id
       LEFT JOIN knowledge_entities k ON k.id = l.matched_service_id
       WHERE l.id = $1 AND l.organization_id = $2`,
      [leadId, organizationId]
    );

    if (res.rows.length === 0) {
      throw createHttpError(404, 'Lead not found.');
    }
    return res.rows[0];
  }

  public static async updateLeadStatus(
    organizationId: string,
    leadId: string,
    newStatus: LeadStatus,
    actorUserId?: string,
    notes?: string
  ): Promise<Lead> {
    const lead = await this.getLeadById(organizationId, leadId);
    const oldStatus = lead.status;

    const res = await db.query(
      `UPDATE leads
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND organization_id = $3
       RETURNING *`,
      [newStatus, leadId, organizationId]
    );

    // Record activity
    await db.query(
      `INSERT INTO lead_activities (organization_id, lead_id, type, title, description, created_by, metadata)
       VALUES ($1, $2, 'STATUS_CHANGE', $3, $4, $5, $6)`,
      [
        organizationId,
        leadId,
        `Status Changed: ${oldStatus} → ${newStatus}`,
        notes || `Lead lifecycle updated from ${oldStatus} to ${newStatus}`,
        actorUserId || null,
        JSON.stringify({ oldStatus, newStatus })
      ]
    );

    await AuditLogger.log({
      organizationId,
      userId: actorUserId,
      action: 'LEAD_STATUS_CHANGED',
      entityType: 'LEAD',
      entityId: leadId,
      details: { oldStatus, newStatus }
    });

    return res.rows[0];
  }

  public static async assignLead(
    organizationId: string,
    leadId: string,
    assignedToUserId: string,
    actorUserId?: string
  ): Promise<Lead> {
    await this.getLeadById(organizationId, leadId);

    // Verify assigned user belongs to this organization
    const memRes = await db.query(
      `SELECT u.full_name FROM organization_memberships m
       JOIN users u ON u.id = m.user_id
       WHERE m.organization_id = $1 AND m.user_id = $2`,
      [organizationId, assignedToUserId]
    );

    if (memRes.rows.length === 0) {
      throw createHttpError(400, 'Assigned user is not a member of this organization.');
    }
    const assignedUserName = memRes.rows[0].full_name;

    const res = await db.query(
      `UPDATE leads
       SET assigned_to_user_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND organization_id = $3
       RETURNING *`,
      [assignedToUserId, leadId, organizationId]
    );

    // Log CRM activity
    await db.query(
      `INSERT INTO lead_activities (organization_id, lead_id, type, title, description, created_by, metadata)
       VALUES ($1, $2, 'ASSIGNMENT', $3, $4, $5, $6)`,
      [
        organizationId,
        leadId,
        `Assigned to ${assignedUserName}`,
        `Lead assigned to team member ${assignedUserName}`,
        actorUserId || null,
        JSON.stringify({ assignedToUserId, assignedUserName })
      ]
    );

    await AuditLogger.log({
      organizationId,
      userId: actorUserId,
      action: 'LEAD_ASSIGNED',
      entityType: 'LEAD',
      entityId: leadId,
      details: { assignedToUserId, assignedUserName }
    });

    return res.rows[0];
  }

  public static async addNote(
    organizationId: string,
    leadId: string,
    content: string,
    userId?: string
  ): Promise<LeadNote> {
    if (!content || !content.trim()) {
      throw createHttpError(400, 'Note content cannot be empty.');
    }

    await this.getLeadById(organizationId, leadId);

    const insertRes = await db.query(
      `INSERT INTO lead_notes (organization_id, lead_id, user_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [organizationId, leadId, userId || null, content.trim()]
    );
    const note = insertRes.rows[0];

    // Activity
    await db.query(
      `INSERT INTO lead_activities (organization_id, lead_id, type, title, description, created_by)
       VALUES ($1, $2, 'NOTE', 'Note Added', $3, $4)`,
      [organizationId, leadId, content.trim().slice(0, 100), userId || null]
    );

    await AuditLogger.log({
      organizationId,
      userId,
      action: 'LEAD_NOTE_CREATED',
      entityType: 'LEAD_NOTE',
      entityId: note.id,
      details: { leadId }
    });

    return note;
  }

  public static async getNotes(organizationId: string, leadId: string): Promise<LeadNote[]> {
    await this.getLeadById(organizationId, leadId);
    const res = await db.query(
      `SELECT n.*, u.full_name as author_name
       FROM lead_notes n
       LEFT JOIN users u ON u.id = n.user_id
       WHERE n.organization_id = $1 AND n.lead_id = $2
       ORDER BY n.created_at DESC`,
      [organizationId, leadId]
    );
    return res.rows;
  }

  public static async addActivity(
    organizationId: string,
    leadId: string,
    activity: {
      type: ActivityType;
      title: string;
      description?: string;
      createdBy?: string;
      scheduledAt?: Date;
      completedAt?: Date;
      metadata?: Record<string, any>;
    }
  ): Promise<LeadActivity> {
    await this.getLeadById(organizationId, leadId);

    const res = await db.query(
      `INSERT INTO lead_activities (organization_id, lead_id, type, title, description, created_by, scheduled_at, completed_at, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        organizationId,
        leadId,
        activity.type,
        activity.title,
        activity.description || null,
        activity.createdBy || null,
        activity.scheduledAt || null,
        activity.completedAt || null,
        JSON.stringify(activity.metadata || {})
      ]
    );

    await AuditLogger.log({
      organizationId,
      userId: activity.createdBy,
      action: 'LEAD_ACTIVITY_CREATED',
      entityType: 'LEAD_ACTIVITY',
      entityId: res.rows[0].id,
      details: { leadId, type: activity.type, title: activity.title }
    });

    return res.rows[0];
  }

  public static async getActivities(organizationId: string, leadId: string): Promise<LeadActivity[]> {
    await this.getLeadById(organizationId, leadId);
    const res = await db.query(
      `SELECT a.*, u.full_name as creator_name
       FROM lead_activities a
       LEFT JOIN users u ON u.id = a.created_by
       WHERE a.organization_id = $1 AND a.lead_id = $2
       ORDER BY a.created_at DESC`,
      [organizationId, leadId]
    );
    return res.rows;
  }

  public static async getTimeline(organizationId: string, leadId: string): Promise<LeadTimelineEvent[]> {
    await this.getLeadById(organizationId, leadId);

    const actRes = await db.query(
      `SELECT a.id, a.type, a.title, a.description, a.created_at as timestamp, u.full_name as actor, a.metadata
       FROM lead_activities a
       LEFT JOIN users u ON u.id = a.created_by
       WHERE a.organization_id = $1 AND a.lead_id = $2`,
      [organizationId, leadId]
    );

    const noteRes = await db.query(
      `SELECT n.id, n.content as description, n.created_at as timestamp, u.full_name as actor
       FROM lead_notes n
       LEFT JOIN users u ON u.id = n.user_id
       WHERE n.organization_id = $1 AND n.lead_id = $2`,
      [organizationId, leadId]
    );

    const events: LeadTimelineEvent[] = [
      ...actRes.rows.map(a => ({
        id: a.id,
        eventType: 'ACTIVITY' as const,
        title: a.title,
        description: a.description,
        timestamp: a.timestamp,
        actor: a.actor,
        metadata: a.metadata
      })),
      ...noteRes.rows.map(n => ({
        id: n.id,
        eventType: 'NOTE' as const,
        title: 'Note Added',
        description: n.description,
        timestamp: n.timestamp,
        actor: n.actor
      }))
    ];

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return events;
  }
}
