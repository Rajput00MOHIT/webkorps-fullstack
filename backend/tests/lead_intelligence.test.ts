import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db/client.js';
import { LeadService } from '../src/modules/leads/leadService.js';
import { LeadScorer } from '../src/modules/leads/leadScorer.js';
import { AssistantService } from '../src/modules/assistant/assistantService.js';

let orgAId: string;
let orgBId: string;
let userAId: string;
let userBId: string;
let websiteAId: string;
let convAId: string;
let leadAId: string;

test('Phase 8: 0. Test Setup & Multi-Tenant CRM Foundations', async () => {
  const orgASlug = `lead-org-a-${Date.now()}`;
  const orgBSlug = `lead-org-b-${Date.now()}`;

  const resA = await db.query(
    `INSERT INTO organizations (name, slug, tier) VALUES ('Vanguard Tech Corp', $1, 'ENTERPRISE') RETURNING id`,
    [orgASlug]
  );
  orgAId = resA.rows[0].id;

  const resB = await db.query(
    `INSERT INTO organizations (name, slug, tier) VALUES ('Vanguard Rival LLC', $1, 'STANDARD') RETURNING id`,
    [orgBSlug]
  );
  orgBId = resB.rows[0].id;

  // Create Users & Memberships
  const userARes = await db.query(
    `INSERT INTO users (email, password_hash, full_name)
     VALUES ($1, 'hash', 'Sarah Connor (Account Exec)') RETURNING id`,
    [`sarah-${Date.now()}@vanguard.example`]
  );
  userAId = userARes.rows[0].id;

  await db.query(
    `INSERT INTO organization_memberships (organization_id, user_id, role)
     VALUES ($1, $2, 'ADMIN')`,
    [orgAId, userAId]
  );

  const userBRes = await db.query(
    `INSERT INTO users (email, password_hash, full_name)
     VALUES ($1, 'hash', 'Rival Agent B') RETURNING id`,
    [`agent-${Date.now()}@rival.example`]
  );
  userBId = userBRes.rows[0].id;

  await db.query(
    `INSERT INTO organization_memberships (organization_id, user_id, role)
     VALUES ($1, $2, 'SALES')`,
    [orgBId, userBId]
  );

  // Primary website for Org A
  const webRes = await db.query(
    `INSERT INTO websites (organization_id, name, domain, is_primary) VALUES ($1, 'Vanguard Site', 'vanguard.example', true) RETURNING id`,
    [orgAId]
  );
  websiteAId = webRes.rows[0].id;

  // Seed Knowledge Graph Ground Truth Entities (Services)
  await db.query(
    `INSERT INTO knowledge_entities (organization_id, name, entity_type, attributes, is_verified)
     VALUES ($1, 'AI & ML Engineering', 'SERVICE', '{"capabilities": ["Custom LLM fine-tuning", "Retrieval Augmented Generation"]}', true)`,
    [orgAId]
  );

  // Initialize an Assistant Conversation for Org A
  const conv = await AssistantService.getOrCreateConversation(orgAId, `lead-conv-${Date.now()}`, websiteAId);
  convAId = conv.id;

  // Simulate assistant conversation turns with HIGH lead intent
  await AssistantService.processQuery(
    orgAId,
    'I want to hire your team for an enterprise AI & ML Engineering deployment. We have budget and need a quote ASAP.',
    convAId,
    undefined,
    { allowLocalFallback: true }
  );

  assert.ok(orgAId);
  assert.ok(orgBId);
  assert.ok(userAId);
  assert.ok(userBId);
  assert.ok(convAId);
});

test('Phase 8: 1. Lead Creation, Validation & Deterministic Scoring', async () => {
  // 1. Valid Lead Creation
  const lead = await LeadService.createLead({
    organizationId: orgAId,
    websiteId: websiteAId,
    fullName: 'David Sterling',
    email: 'david.sterling@enterprise-health.com',
    phone: '+1-555-0199',
    company: 'Enterprise Health Systems',
    jobTitle: 'VP of Technology',
    message: 'We urgently need an enterprise AI & ML Engineering system deployed this month. Please provide a formal proposal and pricing.',
    source: 'CONTACT_FORM'
  });

  leadAId = lead.id;
  assert.ok(lead.id);
  assert.equal(lead.full_name, 'David Sterling');
  assert.equal(lead.email, 'david.sterling@enterprise-health.com');
  assert.equal(lead.status, 'NEW');
  assert.ok(lead.score >= 80); // High commercial intent + Corporate Email + KG Service + Urgent
  assert.equal(lead.priority, 'URGENT');
  assert.equal(lead.score_category, 'HOT');
  assert.ok(lead.score_reasons.length >= 3);

  // 2. Input Validation: Invalid Email format must throw 400
  await assert.rejects(
    async () => {
      await LeadService.createLead({
        organizationId: orgAId,
        fullName: 'Invalid Email User',
        email: 'invalid-email-string',
        message: 'Hello'
      });
    },
    { message: /valid business or personal email/ }
  );

  // 3. Input Validation: Missing required message must throw 400
  await assert.rejects(
    async () => {
      await LeadService.createLead({
        organizationId: orgAId,
        fullName: 'No Message User',
        email: 'test@example.com',
        message: ''
      });
    },
    { message: /Project requirement message is required/ }
  );
});

test('Phase 8: 2. Assistant-to-Lead Handoff & Conversation Lineage', async () => {
  // Capture Lead from Assistant Conversation
  const captured = await LeadService.captureFromAssistant({
    organizationId: orgAId,
    conversationId: convAId,
    fullName: 'Marcus Vance',
    email: 'marcus.vance@techcorp.io',
    phone: '+1-555-9876',
    company: 'TechCorp Solutions',
    jobTitle: 'Chief Technology Officer',
    message: 'Following up on our AI assistant chat. We are ready to start our AI & ML Engineering project immediately.'
  });

  assert.ok(captured.id);
  assert.equal(captured.source, 'AI_ASSISTANT');
  assert.equal(captured.conversation_id, convAId);
  assert.ok(captured.score >= 85);
  assert.equal(captured.qualification.intentLevel, 'HIGH');
  assert.equal(captured.qualification.matchedServiceName, 'AI & ML Engineering');

  // Verify Cross-Tenant Assistant Conversation Capture is strictly BLOCKED
  await assert.rejects(
    async () => {
      await LeadService.captureFromAssistant({
        organizationId: orgBId, // Rival tenant trying to capture Org A conversation
        conversationId: convAId,
        fullName: 'Intruder',
        email: 'intruder@rival.example',
        message: 'Sneaking lead'
      });
    },
    { status: 404 }
  );
});

test('Phase 8: 3. Duplicate Lead Detection & Activity Stamping', async () => {
  // Re-submit the same email for Org A
  const dupLead = await LeadService.createLead({
    organizationId: orgAId,
    fullName: 'David Sterling',
    email: 'david.sterling@enterprise-health.com',
    phone: '+1-555-0199',
    company: 'Enterprise Health Systems',
    message: 'Second inquiry regarding timeline and pricing.'
  });

  assert.ok(dupLead.id);
  assert.ok(dupLead.metadata?.duplicateWarning);
  assert.ok(dupLead.metadata.duplicateWarning.includes(leadAId));
});

test('Phase 8: 4. Lead Lifecycle Status Transition & Activity Stamping', async () => {
  // Transition NEW -> QUALIFYING
  const updated1 = await LeadService.updateLeadStatus(
    orgAId,
    leadAId,
    'QUALIFYING',
    userAId,
    'Initial qualification call scheduled'
  );
  assert.equal(updated1.status, 'QUALIFYING');

  // Transition QUALIFYING -> QUALIFIED
  const updated2 = await LeadService.updateLeadStatus(
    orgAId,
    leadAId,
    'QUALIFIED',
    userAId,
    'Confirmed budget of $150k and Q1 implementation'
  );
  assert.equal(updated2.status, 'QUALIFIED');

  // Verify activities recorded
  const activities = await LeadService.getActivities(orgAId, leadAId);
  const statusActivities = activities.filter(a => a.type === 'STATUS_CHANGE');
  assert.ok(statusActivities.length >= 2);
});

test('Phase 8: 5. Lead Assignment & RBAC Boundary Protection', async () => {
  // 1. Assign to valid Org A user
  const assigned = await LeadService.assignLead(orgAId, leadAId, userAId, userAId);
  assert.equal(assigned.assigned_to_user_id, userAId);

  // 2. Reject assignment to user belonging to another organization
  await assert.rejects(
    async () => {
      await LeadService.assignLead(orgAId, leadAId, userBId); // userB belongs to Org B
    },
    { message: /not a member of this organization/ }
  );
});

test('Phase 8: 6. CRM Notes, Activities & Chronological Timeline', async () => {
  // 1. Add Note
  const note = await LeadService.addNote(
    orgAId,
    leadAId,
    'Client requested NDA before sharing technical architecture diagrams.',
    userAId
  );
  assert.ok(note.id);
  assert.equal(note.content, 'Client requested NDA before sharing technical architecture diagrams.');

  // 2. Log Meeting Activity
  const activity = await LeadService.addActivity(orgAId, leadAId, {
    type: 'MEETING',
    title: 'Technical Discovery Call',
    description: 'Reviewed architecture requirements with VP of Tech.',
    createdBy: userAId,
    scheduledAt: new Date()
  });
  assert.ok(activity.id);
  assert.equal(activity.type, 'MEETING');

  // 3. Fetch Timeline
  const timeline = await LeadService.getTimeline(orgAId, leadAId);
  assert.ok(timeline.length >= 3);
  const noteEvent = timeline.find(e => e.eventType === 'NOTE');
  const meetingEvent = timeline.find(e => e.title === 'Technical Discovery Call');
  assert.ok(noteEvent);
  assert.ok(meetingEvent);
});

test('Phase 8: 7. Multi-Tenant Isolation & Cross-Tenant Security', async () => {
  // Org B cannot access Org A's lead
  await assert.rejects(
    async () => {
      await LeadService.getLeadById(orgBId, leadAId);
    },
    { status: 404 }
  );

  // Org B cannot add notes to Org A's lead
  await assert.rejects(
    async () => {
      await LeadService.addNote(orgBId, leadAId, 'Malicious Note');
    },
    { status: 404 }
  );

  // Org B cannot list Org A's leads
  const orgBLeads = await LeadService.getLeads(orgBId);
  assert.equal(orgBLeads.leads.length, 0);
});

test('Phase 8: 8. Audit Logging Verification', async () => {
  const logsRes = await db.query(
    `SELECT action, entity_type FROM audit_logs WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 15`,
    [orgAId]
  );
  const actions = logsRes.rows.map(r => r.action);

  assert.ok(actions.includes('LEAD_CREATED'));
  assert.ok(actions.includes('LEAD_STATUS_CHANGED'));
  assert.ok(actions.includes('LEAD_ASSIGNED'));
  assert.ok(actions.includes('LEAD_NOTE_CREATED'));
});
