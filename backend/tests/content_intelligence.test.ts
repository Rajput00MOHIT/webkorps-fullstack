import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db/client.js';
import { ContentProjectService } from '../src/modules/content/contentProjectService.js';
import { ContentBriefService } from '../src/modules/content/contentBriefService.js';
import { ContentDraftService } from '../src/modules/content/contentDraftService.js';
import { ContentValidationService } from '../src/modules/content/contentValidationService.js';
import { ContentReviewService } from '../src/modules/content/contentReviewService.js';
import { ContentProviderUnavailableError } from '../src/modules/content/contentGenerationProvider.js';

let orgAId: string;
let orgBId: string;
let websiteAId: string;
let opportunityId: string;
let projectId: string;
let briefId: string;
let draftId: string;

test('Phase 6: 0. Test Setup & Multi-Tenant Foundations', async () => {
  const orgASlug = `content-org-a-${Date.now()}`;
  const orgBSlug = `content-org-b-${Date.now()}`;

  const resA = await db.query(
    `INSERT INTO organizations (name, slug, tier) VALUES ('Webkorps Enterprise Corp', $1, 'ENTERPRISE') RETURNING id`,
    [orgASlug]
  );
  orgAId = resA.rows[0].id;

  const resB = await db.query(
    `INSERT INTO organizations (name, slug, tier) VALUES ('Rival Firm B', $1, 'STANDARD') RETURNING id`,
    [orgBSlug]
  );
  orgBId = resB.rows[0].id;

  // Primary website for Org A
  const webRes = await db.query(
    `INSERT INTO websites (organization_id, name, domain, is_primary) VALUES ($1, 'Webkorps Main Site', 'webkorps.com', true) RETURNING id`,
    [orgAId]
  );
  websiteAId = webRes.rows[0].id;

  // Seed Crawl Page for Internal Linking
  await db.query(
    `INSERT INTO pages (website_id, organization_id, url, path, title)
     VALUES ($1, $2, 'https://webkorps.com/services/ai-engineering', '/services/ai-engineering', 'AI Engineering Services | Webkorps')`,
    [websiteAId, orgAId]
  );

  // Seed Knowledge Graph Ground Truth Entities
  await db.query(
    `INSERT INTO knowledge_entities (organization_id, name, entity_type, attributes, is_verified)
     VALUES ($1, 'Webkorps Enterprise Corp', 'COMPANY', '{"employee_count": 250, "headquarters": "San Francisco", "founded_year": 2018}', true)`,
    [orgAId]
  );
  await db.query(
    `INSERT INTO knowledge_entities (organization_id, name, entity_type, attributes, is_verified)
     VALUES ($1, 'AI development services', 'SERVICE', '{"capabilities": ["Custom LLM fine-tuning", "Retrieval Augmented Generation", "MLOps pipelines"]}', true)`,
    [orgAId]
  );

  // Seed a Phase 5 Opportunity
  const oppRes = await db.query(
    `INSERT INTO opportunities (
      organization_id, opportunity_type, title, description, priority, score, status, query, problem_statement, recommended_action
    ) VALUES (
      $1, 'MISSING_AI_CITATION', 'Competitors cited for AI Development Services',
      'Webkorps lacks AI visibility on enterprise development queries.', 'HIGH', 88, 'DISCOVERED',
      'best enterprise AI development services', 'Competitors captured 80% AI citations', 'Publish authoritative technical service guide'
    ) RETURNING id`,
    [orgAId]
  );
  opportunityId = oppRes.rows[0].id;

  assert.ok(orgAId);
  assert.ok(orgBId);
  assert.ok(websiteAId);
  assert.ok(opportunityId);
});

test('Phase 6: 1. Content Project Creation & Phase 5 Opportunity Integration', async () => {
  // Create Project originating from Phase 5 Opportunity
  const project = await ContentProjectService.createProject({
    organizationId: orgAId,
    websiteId: websiteAId,
    opportunityId,
    title: 'Enterprise AI Development Services Guide',
    targetKeyword: 'enterprise AI development services',
    contentType: 'SERVICE_PAGE',
    audience: 'Chief Technology Officers & VP of Engineering'
  });

  projectId = project.id;
  assert.equal(project.title, 'Enterprise AI Development Services Guide');
  assert.equal(project.opportunity_id, opportunityId);
  assert.equal(project.status, 'IDEA');
  assert.equal(project.content_type, 'SERVICE_PAGE');

  // Verify Validation: Title and TargetKeyword required
  await assert.rejects(
    async () => {
      await ContentProjectService.createProject({
        organizationId: orgAId,
        title: '',
        targetKeyword: 'keyword'
      });
    },
    { message: /Project title is required/ }
  );
});

test('Phase 6: 2. Content Brief Generation with Grounded Evidence', async () => {
  const brief = await ContentBriefService.generateBrief(orgAId, projectId);
  briefId = brief.id;

  assert.ok(brief);
  assert.equal(brief.content_project_id, projectId);
  assert.equal(brief.primary_keyword, 'enterprise AI development services');
  assert.ok(brief.recommended_outline && brief.recommended_outline.length >= 4);

  // Verify internal links were pulled from real crawl pages
  assert.ok(brief.internal_links && brief.internal_links.length > 0);
  assert.equal(brief.internal_links[0].url, 'https://webkorps.com/services/ai-engineering');

  // Verify project status updated to BRIEF_READY
  const project = await ContentProjectService.getProjectById(orgAId, projectId);
  assert.equal(project.status, 'BRIEF_READY');

  // Verify Idempotency: Re-generating brief updates existing record rather than duplicating
  const briefSecond = await ContentBriefService.generateBrief(orgAId, projectId);
  assert.equal(briefSecond.id, brief.id);
});

test('Phase 6: 3. Provider Abstraction & Guardrails (Strictly No Fake Data)', async () => {
  // Test 1: If live API key is absent and local fallback is false, MUST throw ContentProviderUnavailableError
  await assert.rejects(
    async () => {
      await ContentDraftService.generateDraft({
        organizationId: orgAId,
        projectId,
        allowLocalTemplateFallback: false
      });
    },
    (err: any) => {
      assert.ok(err instanceof ContentProviderUnavailableError || err.name === 'ContentProviderUnavailableError');
      return true;
    }
  );

  // Test 2: Generate draft using grounded deterministic engine
  const draft = await ContentDraftService.generateDraft({
    organizationId: orgAId,
    projectId,
    allowLocalTemplateFallback: true
  });

  draftId = draft.id;
  assert.ok(draft);
  assert.equal(draft.version, 1);
  assert.ok(draft.body_markdown.includes('enterprise AI development services'));
  assert.ok(draft.body_markdown.includes('Executive Summary & Strategic Matrix'));
  assert.ok(draft.body_markdown.includes('Webkorps'));

  // Test 3: Versioning - Generating next draft increments version without overwriting version 1
  const draftV2 = await ContentDraftService.generateDraft({
    organizationId: orgAId,
    projectId,
    allowLocalTemplateFallback: true
  });

  assert.equal(draftV2.version, 2);
  const allDrafts = await ContentDraftService.getDrafts(orgAId, projectId);
  assert.equal(allDrafts.length, 2);
  assert.equal(allDrafts[0].version, 2);
  assert.equal(allDrafts[1].version, 1);
});

test('Phase 6: 4. Fact Validation - Supported vs Unsupported Claims', async () => {
  // Clean draft with verified facts
  const cleanBody = `
# Enterprise AI Development Services Guide

In modern technology, enterprise AI development services are essential.
Webkorps Enterprise Corp provides AI development services and Cloud migration.

| Pillar | Capability | Proof |
|---|---|---|
| AI | RAG & MLOps | Grounded |

## Key Capabilities
Enterprise organizations deploy AI development services with high throughput.
[AI Engineering](/services/ai-engineering)

## Frequently Asked Questions
### What is enterprise AI development services?
Direct answer for AI discovery.
  `.trim();

  const cleanVal = await ContentValidationService.validateFacts(
    orgAId,
    draftId,
    cleanBody,
    'enterprise AI development services',
    [{ entity_type: 'COMPANY', name: 'Webkorps Enterprise Corp', attributes: { employee_count: 250 } }],
    { evidence_sources: [] }
  );

  // Clean body should pass or have only supported findings
  const unsupportedClean = cleanVal.findings.filter((f: any) => f.status === 'UNSUPPORTED');
  assert.equal(unsupportedClean.length, 0);

  // Body with hallucinated/unsupported claim: "Webkorps has 500+ employees"
  const hallucinatedBody = `
# Enterprise AI Development Services Guide
Webkorps has 500+ employees across the globe.
  `.trim();

  const dirtyVal = await ContentValidationService.validateFacts(
    orgAId,
    draftId,
    hallucinatedBody,
    'enterprise AI development services',
    [{ entity_type: 'COMPANY', name: 'Webkorps Enterprise Corp', attributes: { employee_count: 250 } }],
    { evidence_sources: [] }
  );

  const unsupportedDirty = dirtyVal.findings.filter((f: any) => f.status === 'UNSUPPORTED');
  assert.ok(unsupportedDirty.length > 0);
  assert.equal(unsupportedDirty[0].status, 'UNSUPPORTED');
  assert.ok(unsupportedDirty[0].actionRequired.includes('Human review required'));
  assert.equal(dirtyVal.status, 'NEEDS_REVIEW');
});

test('Phase 6: 5. SEO Validation via Structural Signals', async () => {
  const seoVal = await ContentValidationService.validateSEO(orgAId, draftId, {
    title: 'Enterprise AI Development Services Guide | Webkorps',
    bodyMarkdown: `
# Enterprise AI Development Services Guide

Comprehensive guide to enterprise AI development services.

## Architecture
Overview of technical stacks.

## Key Capabilities
Enterprise best practices.
[AI Services](/services/ai-engineering)

${'Enterprise software architectures require high throughput, low latency, and robust observability. '.repeat(40)}
    `.trim(),
    metaDescription: 'Authoritative guide to enterprise AI development services and architectures by Webkorps engineering leadership.',
    primaryKeyword: 'enterprise AI development services'
  });

  assert.ok(seoVal.score >= 70);
  const singleH1 = seoVal.findings.find((f: any) => f.rule === 'SINGLE_H1_HEADING');
  assert.ok(singleH1 && singleH1.passed);
  const kwPresence = seoVal.findings.find((f: any) => f.rule === 'KEYWORD_PRESENCE');
  assert.ok(kwPresence && kwPresence.passed);
});

test('Phase 6: 6. GEO Validation (AI Engine Discoverability Readiness)', async () => {
  const geoVal = await ContentValidationService.validateGEO(
    orgAId,
    draftId,
    `
# Enterprise AI Architecture
Enterprise AI development services is a suite of machine learning competencies.

| Framework | Throughput | Latency |
|---|---|---|
| RAG | 1200 req/s | 45ms |

## Frequently Asked Questions
### How does AI development scale?
AI models scale via microservices and GPU clustering.
    `,
    'enterprise AI development services',
    []
  );

  assert.ok(geoVal.score >= 75);
  const entityDef = geoVal.findings.find((f: any) => f.rule === 'ENTITY_DEFINITION_CLARITY');
  assert.ok(entityDef && entityDef.passed);
  const tableCheck = geoVal.findings.find((f: any) => f.rule === 'STRUCTURED_DATA_MATRIX');
  assert.ok(tableCheck && tableCheck.passed);
  const faqCheck = geoVal.findings.find((f: any) => f.rule === 'FAQ_STRUCTURAL_COVERAGE');
  assert.ok(faqCheck && faqCheck.passed);
});

test('Phase 6: 7. Duplicate Content & Keyword Cannibalization Detection', async () => {
  // Existing page has title 'AI Engineering Services | Webkorps'
  const dupCheck = await ContentValidationService.validateDuplicates(
    orgAId,
    draftId,
    projectId,
    'Enterprise AI Engineering Services Guide',
    'AI Engineering Services'
  );

  const overlapFinding = dupCheck.findings.find((f: any) => f.rule === 'EXISTING_PAGE_OVERLAP');
  assert.ok(overlapFinding);
  // It flags the match with https://webkorps.com/services/ai-engineering
  assert.equal(overlapFinding.passed, false);
});

test('Phase 6: 8. Human Review Workflow (Strictly No Auto-Publishing)', async () => {
  // Step 1: Reviewer requests changes
  const review1 = await ContentReviewService.submitReview(orgAId, draftId, {
    decision: 'CHANGES_REQUESTED',
    reviewerName: 'Chief Editor',
    comments: 'Please verify the architecture diagram citation before final release.'
  });

  assert.equal(review1.decision, 'CHANGES_REQUESTED');
  let draft = await ContentDraftService.getDraftById(orgAId, draftId);
  assert.equal(draft.status, 'NEEDS_REVIEW');
  let project = await ContentProjectService.getProjectById(orgAId, projectId);
  assert.equal(project.status, 'NEEDS_REVIEW');

  // Step 2: Reviewer approves draft
  const review2 = await ContentReviewService.submitReview(orgAId, draftId, {
    decision: 'APPROVED',
    reviewerName: 'Managing Editor',
    comments: 'All facts verified against Knowledge Graph and SEO criteria.'
  });

  assert.equal(review2.decision, 'APPROVED');
  draft = await ContentDraftService.getDraftById(orgAId, draftId);
  assert.equal(draft.status, 'APPROVED');
  project = await ContentProjectService.getProjectById(orgAId, projectId);
  assert.equal(project.status, 'APPROVED');

  // Verify Zero Automatic Publishing: Draft status is APPROVED, never auto-published or pushed to CMS
  assert.equal(draft.status, 'APPROVED');
});

test('Phase 6: 9. Multi-Tenant Isolation & Cross-Tenant Security', async () => {
  // Org B cannot access Org A's content project
  await assert.rejects(
    async () => {
      await ContentProjectService.getProjectById(orgBId, projectId);
    },
    { status: 404 }
  );

  // Org B cannot access Org A's content brief
  await assert.rejects(
    async () => {
      await ContentBriefService.getBriefById(orgBId, briefId);
    },
    { status: 404 }
  );

  // Org B cannot submit a review on Org A's draft
  await assert.rejects(
    async () => {
      await ContentReviewService.submitReview(orgBId, draftId, {
        decision: 'APPROVED',
        reviewerName: 'Intruder'
      });
    },
    { status: 404 }
  );
});

test('Phase 6: 10. Audit Logging Verification', async () => {
  const logsRes = await db.query(
    `SELECT action, entity_type FROM audit_logs WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 10`,
    [orgAId]
  );
  const actions = logsRes.rows.map(r => r.action);

  assert.ok(actions.includes('CONTENT_PROJECT_CREATED'));
  assert.ok(actions.includes('CONTENT_BRIEF_GENERATED'));
  assert.ok(actions.includes('GENERATE_CONTENT_DRAFT'));
  assert.ok(actions.includes('REVIEW_CONTENT_DRAFT'));
});
