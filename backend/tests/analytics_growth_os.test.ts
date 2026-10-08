import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db/client.js';
import { AnalyticsService } from '../src/modules/analytics/analyticsService.js';
import { ContentProjectService } from '../src/modules/content/contentProjectService.js';
import { LeadService } from '../src/modules/leads/leadService.js';

let orgAId: string;
let orgBId: string;
let websiteAId: string;
let actionAId: string;

test.before(async () => {
  await db.ensureReady();
  const timestamp = Date.now();

  const orgResA = await db.query(
    `INSERT INTO organizations (name, slug, tier) VALUES ('Apex Global Enterprise', $1, 'ENTERPRISE') RETURNING id`,
    [`apex-global-growth-${timestamp}`]
  );
  orgAId = orgResA.rows[0].id;

  const orgResB = await db.query(
    `INSERT INTO organizations (name, slug, tier) VALUES ('Rival Cyber Co', $1, 'GROWTH') RETURNING id`,
    [`rival-cyber-growth-${timestamp}`]
  );
  orgBId = orgResB.rows[0].id;

  const webResA = await db.query(
    `INSERT INTO websites (organization_id, domain, name)
     VALUES ($1, 'apex-global.example', 'Apex Global Main') RETURNING id`,
    [orgAId]
  );
  websiteAId = webResA.rows[0].id;
});

test('Phase 9: 1. Website & Crawl Health Analytics', async () => {
  // 1. Seed pages for Org A
  await db.query(
    `INSERT INTO pages (organization_id, website_id, url, path, http_status, title, word_count, indexability)
     VALUES 
       ($1, $2, 'https://apex-global.example/about', '/about', 200, 'About Us', 850, 'INDEXABLE'),
       ($1, $2, 'https://apex-global.example/services', '/services', 200, 'Enterprise AI Services', 1400, 'INDEXABLE'),
       ($1, $2, 'https://apex-global.example/hidden', '/hidden', 404, 'Not Found', 50, 'ERROR')`,
    [orgAId, websiteAId]
  );

  // 2. Seed a crawl run
  await db.query(
    `INSERT INTO crawl_runs (organization_id, website_id, status, pages_crawled, pages_discovered, completed_at)
     VALUES ($1, $2, 'COMPLETED', 3, 3, CURRENT_TIMESTAMP)`,
    [orgAId, websiteAId]
  );

  const analytics = await AnalyticsService.getWebsiteAnalytics(orgAId, websiteAId);
  assert.equal(analytics.totalWebsites, 1);
  assert.equal(analytics.totalPagesDiscovered, 3);
  assert.equal(analytics.totalPagesCrawled, 3);
  assert.equal(analytics.indexablePages, 2);
  assert.equal(analytics.nonIndexablePages, 1);
  assert.equal(analytics.successfulCrawlRuns, 1);
});

test('Phase 9: 2. SEO Health, Severity Distribution & Trend Calculation', async () => {
  // 1. Seed SEO Issues for Org A
  await db.query(
    `INSERT INTO seo_issues (organization_id, website_id, issue_type, severity, description, recommendation, status)
     VALUES 
       ($1, $2, 'MISSING_H1', 'CRITICAL', 'Missing H1 tag on critical landing page', 'Add a unique H1 tag to the page header', 'OPEN'),
       ($1, $2, 'SLOW_LCP', 'HIGH', 'Largest contentful paint exceeds 3.5s', 'Optimize hero images and preload key CSS', 'OPEN'),
       ($1, $2, 'BROKEN_LINK', 'MEDIUM', '404 broken external anchor link', 'Update or remove broken hyperlink', 'RESOLVED')`,
    [orgAId, websiteAId]
  );

  const seoMetrics = await AnalyticsService.getSEOAnalytics(orgAId);
  assert.equal(seoMetrics.totalIssues, 3);
  assert.equal(seoMetrics.criticalIssues, 1);
  assert.equal(seoMetrics.highIssues, 1);
  assert.equal(seoMetrics.mediumIssues, 1);
  assert.equal(seoMetrics.resolvedIssues, 1);
  assert.ok(seoMetrics.topIssues.length >= 1);
  assert.equal(seoMetrics.topIssues[0].severity, 'CRITICAL');
});

test('Phase 9: 3. Empirical GEO / AI Visibility Analytics', async () => {
  // 1. Seed Visibility Prompt and Observation Run
  const pRes = await db.query(
    `INSERT INTO visibility_prompts (organization_id, prompt_text, category, target_entity, active)
     VALUES ($1, 'Which company provides top enterprise AI solutions?', 'SERVICE', 'Apex Global Enterprise', true) RETURNING id`,
    [orgAId]
  );
  const promptId = pRes.rows[0].id;

  const engRes = await db.query(`SELECT id FROM ai_engines WHERE engine_key = 'PERPLEXITY' LIMIT 1`);
  const engineId = engRes.rows.length > 0 ? engRes.rows[0].id : null;

  const obsRes = await db.query(
    `INSERT INTO ai_observation_runs (organization_id, ai_engine_id, prompt_id, provider, model, raw_prompt, raw_response_text, status)
     VALUES ($1, $2, $3, 'perplexity', 'sonar-medium', 'Which company provides top enterprise AI solutions?', 'Apex Global Enterprise is a leading provider.', 'COMPLETED') RETURNING id`,
    [orgAId, engineId, promptId]
  );
  const runId = obsRes.rows[0].id;

  // 2. Seed Brand Mention & Citations
  await db.query(
    `INSERT INTO ai_mentions (organization_id, observation_run_id, brand_name, entity_name, is_target_brand, mentioned, recommendation_signal, position)
     VALUES ($1, $2, 'Apex Global Enterprise', 'Apex Global Enterprise', true, true, true, 1)`,
    [orgAId, runId]
  );

  await db.query(
    `INSERT INTO ai_citations (organization_id, observation_run_id, cited_url, cited_domain, is_target_domain, is_target_owned)
     VALUES ($1, $2, 'https://apex-global.example/case-study', 'apex-global.example', true, true)`,
    [orgAId, runId]
  );

  const geoMetrics = await AnalyticsService.getGEOAnalytics(orgAId);
  assert.equal(geoMetrics.totalObservationRuns, 1);
  assert.equal(geoMetrics.targetBrandMentionRate.ratePercentage, 100);
  assert.equal(geoMetrics.targetBrandMentionRate.mentionsCount, 1);
  assert.equal(geoMetrics.recommendationRate.ratePercentage, 100);
  assert.equal(geoMetrics.citationRate.ownedDomainRatePercentage, 100);
  assert.equal(geoMetrics.citationRate.ownedCitationsCount, 1);
  assert.equal(geoMetrics.promptCoverage.coveragePercentage, 100);
});

test('Phase 9: 4. Opportunity Backlog & Automatic Growth Action Queue', async () => {
  // 1. Create a high-priority opportunity in Phase 5 engine
  const oppRes = await db.query(
    `INSERT INTO opportunities (
       organization_id, title, description, opportunity_type, priority, impact, confidence, effort, score, evidence, status
     ) VALUES (
       $1, 'Increase Healthcare Evidence Citation Coverage', 
       'Competitors are cited in 70% of prompts while owned citations appear in 30%.',
       'GEO_CITATIONS_GAP', 'HIGH', 85, 0.90, 'MEDIUM', 85.0, 
       '{"promptCategory": "HEALTHCARE", "competitorCount": 3}', 'OPEN'
     ) RETURNING *`,
    [orgAId]
  );
  const opp = oppRes.rows[0];
  assert.ok(opp.id);

  // 2. Verify Opportunity Analytics
  const oppMetrics = await AnalyticsService.getOpportunityAnalytics(orgAId);
  assert.ok(oppMetrics.totalOpportunities >= 1);
  assert.ok(oppMetrics.highOpportunities >= 1);

  // 3. Verify Growth Actions syncs opportunity to actionable backlog
  const actions = await AnalyticsService.getGrowthActions(orgAId);
  assert.ok(actions.length >= 1);
  const action = actions.find(a => a.opportunityId === opp.id);
  assert.ok(action);
  assert.equal(action.title, 'Increase Healthcare Evidence Citation Coverage');
  assert.equal(action.priority, 'HIGH');
  assert.equal(action.status, 'OPEN');
  actionAId = action.id;
});

test('Phase 9: 5. Action Queue Lifecycle & Status Transitions', async () => {
  // 1. Transition Action OPEN -> IN_PROGRESS
  const inProg = await AnalyticsService.updateActionStatus(orgAId, actionAId, 'IN_PROGRESS');
  assert.equal(inProg.status, 'IN_PROGRESS');
  assert.equal(inProg.completedAt, null);

  // 2. Transition Action IN_PROGRESS -> COMPLETED
  const completed = await AnalyticsService.updateActionStatus(orgAId, actionAId, 'COMPLETED');
  assert.equal(completed.status, 'COMPLETED');
  assert.ok(completed.completedAt);
});

test('Phase 9: 6. Content Pipeline & Quality Analytics', async () => {
  // 1. Create a content project
  await ContentProjectService.createProject({
    organizationId: orgAId,
    title: 'Enterprise AI Healthcare Solutions Guide',
    targetKeyword: 'enterprise healthcare ai solutions'
  });

  const contentMetrics = await AnalyticsService.getContentAnalytics(orgAId);
  assert.ok(contentMetrics.totalProjects >= 1);
  assert.equal(contentMetrics.byStatus['IDEA'], 1);
});

test('Phase 9: 7. Lead Pipeline, Conversion & Source Performance', async () => {
  // 1. Create a lead via LeadService
  const lead = await LeadService.createLead({
    organizationId: orgAId,
    fullName: 'Elena Rostova',
    email: 'elena@meditech.io',
    phone: '+1-555-4321',
    company: 'MediTech Innovations',
    jobTitle: 'Chief Medical Officer',
    message: 'We want to hire your engineering team for an urgent HIPAA-compliant AI deployment.',
    source: 'CONTACT_FORM'
  });

  // Advance to QUALIFIED and CONVERTED
  await LeadService.updateLeadStatus(orgAId, lead.id, 'QUALIFIED');
  await LeadService.updateLeadStatus(orgAId, lead.id, 'CONVERTED');

  const leadMetrics = await AnalyticsService.getLeadAnalytics(orgAId);
  assert.ok(leadMetrics.totalLeads >= 1);
  assert.equal(leadMetrics.byStatus['CONVERTED'], 1);
  assert.equal(leadMetrics.overallConversionRate.ratePercentage, 100);
  assert.ok(leadMetrics.averageLeadScore >= 70);
  assert.ok(leadMetrics.bySource.length >= 1);
  assert.equal(leadMetrics.bySource[0].source, 'CONTACT_FORM');
  assert.equal(leadMetrics.bySource[0].conversionRate, 100);
});

test('Phase 9: 8. Deterministic Growth Diagnosis Engine', async () => {
  const diagnoses = await AnalyticsService.getGrowthDiagnosis(orgAId);
  assert.ok(diagnoses.length >= 1);

  // Verify diagnosis has clear metric, change, severity, summary, and empirical evidence
  const seoDiag = diagnoses.find(d => d.category === 'SEO');
  assert.ok(seoDiag);
  assert.ok(seoDiag.severity === 'CRITICAL' || seoDiag.severity === 'WARNING');
  assert.ok(seoDiag.summary.includes('critical') || seoDiag.summary.includes('SEO'));
  assert.ok(seoDiag.evidence.length > 0);

  const leadDiag = diagnoses.find(d => d.category === 'LEADS');
  assert.ok(leadDiag);
  assert.equal(leadDiag.severity, 'POSITIVE');
  assert.ok(leadDiag.summary.includes('ICP') || leadDiag.summary.includes('leads'));
});

test('Phase 9: 9. Consolidated Growth Snapshot', async () => {
  const snapshot = await AnalyticsService.getGrowthSnapshot(orgAId);
  assert.equal(snapshot.organization.id, orgAId);
  assert.equal(snapshot.organization.name, 'Apex Global Enterprise');
  assert.ok(snapshot.kpiSummary.indexablePages >= 2);
  assert.ok(snapshot.kpiSummary.openSeoIssues >= 2);
  assert.ok(snapshot.kpiSummary.totalLeads >= 1);
  assert.ok(snapshot.diagnoses.length >= 1);
  assert.ok(snapshot.dataFreshness.generatedAt);
});

test('Phase 9: 10. Strict Multi-Tenant Isolation', async () => {
  // Org B must receive completely clean/empty analytics isolated from Org A
  const orgBWebsite = await AnalyticsService.getWebsiteAnalytics(orgBId);
  assert.equal(orgBWebsite.totalPagesCrawled, 0);
  assert.equal(orgBWebsite.totalWebsites, 0);

  const orgBSeo = await AnalyticsService.getSEOAnalytics(orgBId);
  assert.equal(orgBSeo.totalIssues, 0);
  assert.equal(orgBSeo.criticalIssues, 0);

  const orgBLeads = await AnalyticsService.getLeadAnalytics(orgBId);
  assert.equal(orgBLeads.totalLeads, 0);
  assert.equal(orgBLeads.convertedLeads, 0);

  const orgBActions = await AnalyticsService.getGrowthActions(orgBId);
  assert.equal(orgBActions.length, 0);
});

test('Phase 9: 11. Graceful Empty State Handling (NO_DATA / Zero Crashes)', async () => {
  const emptyOrgSlug = `empty-org-${Date.now()}`;
  const emptyRes = await db.query(
    `INSERT INTO organizations (name, slug, tier) VALUES ('Empty Tenant', $1, 'STANDARD') RETURNING id`,
    [emptyOrgSlug]
  );
  const emptyOrgId = emptyRes.rows[0].id;

  const snapshot = await AnalyticsService.getGrowthSnapshot(emptyOrgId);
  assert.equal(snapshot.kpiSummary.indexablePages, 0);
  assert.equal(snapshot.kpiSummary.openSeoIssues, 0);
  assert.equal(snapshot.kpiSummary.aiMentionRatePercentage, 0);
  assert.equal(snapshot.kpiSummary.totalLeads, 0);
  assert.equal(snapshot.topActions.length, 0);
});

test('Phase 9: 12. AI Usage & Estimated Operating Cost Analytics', async () => {
  await db.query(
    `INSERT INTO ai_usage_logs (organization_id, feature, provider, model_name, prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd, latency_ms)
     VALUES 
       ($1, 'CONTENT_DRAFT', 'gemini', 'gemini-1.5-flash', 1200, 800, 2000, 0.0006, 650),
       ($1, 'GEO_OBSERVATION', 'gemini', 'gemini-1.5-flash', 500, 300, 800, 0.00024, 420)`,
    [orgAId]
  );

  const usage = await AnalyticsService.getAIUsageAnalytics(orgAId);
  assert.equal(usage.totalRequests, 2);
  assert.equal(usage.totalTokens, 2800);
  assert.ok(usage.estimatedCostUsd > 0);
  assert.ok(usage.byFeature['CONTENT_DRAFT']);
  assert.equal(usage.byFeature['CONTENT_DRAFT'].requests, 1);
});
