import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db/client.js';
import { SSRFGuard } from '../src/modules/crawler/ssrfGuard.js';
import { BrowserRenderer } from '../src/modules/crawler/browserRenderer.js';
import { CrawlerService } from '../src/modules/crawler/crawlerService.js';
import { ObservationParser } from '../src/modules/geo/observationParser.js';
import { OpportunityEngine } from '../src/modules/geo/opportunityEngine.js';
import { PromptGenerator } from '../src/modules/geo/promptGenerator.js';
import { GEOMetricsService } from '../src/modules/geo/geoMetricsService.js';
import { GEOService } from '../src/modules/geo/geoService.js';

let orgId: string;
let otherOrgId: string;

test('GEO: 0. Test Setup', async () => {
  const orgSlug = `geo-test-org-${Date.now()}`;
  const orgRes = await db.query(
    `INSERT INTO organizations (name, slug, tier) VALUES ('GEO Test Org', $1, 'ENTERPRISE') RETURNING id`,
    [orgSlug]
  );
  orgId = orgRes.rows[0].id;

  const otherOrgSlug = `geo-other-org-${Date.now()}`;
  const otherOrgRes = await db.query(
    `INSERT INTO organizations (name, slug, tier) VALUES ('Other Org', $1, 'STANDARD') RETURNING id`,
    [otherOrgSlug]
  );
  otherOrgId = otherOrgRes.rows[0].id;
  assert.ok(orgId);
  assert.ok(otherOrgId);
});

// 1. Universal Crawler: Accepts Arbitrary Public Domain & Page Targets
test('GEO: 1. Universal Crawler accepts arbitrary domain & page targets', async () => {
  const queueDomain = await CrawlerService.queueCrawl({
    organizationId: orgId,
    targetUrl: 'https://crawler-test.example',
    scope: 'DOMAIN',
    maxPages: 10,
    executeWorker: false
  });
  assert.equal(queueDomain.status, 'QUEUED');
  assert.equal(queueDomain.targetUrl, 'https://crawler-test.example');
  assert.ok(queueDomain.crawlRunId);

  // Verify website record was automatically linked to tenant as non-primary
  const webCheck = await db.query(
    `SELECT domain, is_primary FROM websites WHERE domain = 'crawler-test.example' AND organization_id = $1`,
    [orgId]
  );
  assert.equal(webCheck.rows.length, 1);
  assert.equal(webCheck.rows[0].is_primary, false, 'Arbitrary research target must not be primary company website');

  // Page scope test
  const queuePage = await CrawlerService.queueCrawl({
    organizationId: orgId,
    targetUrl: 'https://crawler-test.example/pricing',
    scope: 'PAGE',
    maxPages: 100,
    executeWorker: false
  });
  assert.equal(queuePage.status, 'QUEUED');

  const runCheck = await db.query(`SELECT max_pages, scope FROM crawl_runs WHERE id = $1`, [queuePage.crawlRunId]);
  assert.equal(runCheck.rows[0].max_pages, 1, 'PAGE scope must strictly cap crawl budget to 1');
  assert.equal(runCheck.rows[0].scope, 'PAGE');
});

// 2. Universal Crawler: Configurable crawl budgets & scopes
test('GEO: 2. Universal Crawler configurable budget and scope persistence', async () => {
  const customBudget = await CrawlerService.queueCrawl({
    organizationId: orgId,
    targetUrl: 'https://custom-target.example',
    scope: 'DIRECTORY',
    maxPages: 150,
    executeWorker: false
  });
  const run = await db.query(`SELECT max_pages, scope, render_javascript FROM crawl_runs WHERE id = $1`, [customBudget.crawlRunId]);
  assert.equal(run.rows[0].max_pages, 150);
  assert.equal(run.rows[0].scope, 'DIRECTORY');
  assert.equal(run.rows[0].render_javascript, false);
});

// 3. Universal Crawler: SSRF & Local Crawl Policy
test('GEO: 3. Universal Crawler SSRF protection with local crawl policy', async () => {
  // Cloud metadata must ALWAYS be blocked
  const metaCheck = await SSRFGuard.validateUrl('http://169.254.169.254/latest/meta-data/', { allowLocal: true });
  assert.equal(metaCheck.safe, false, 'Cloud metadata IP must be strictly forbidden under all circumstances');

  // Default localhost check without local crawl flag
  const localBlocked = await SSRFGuard.validateUrl('http://localhost:3000', { allowLocal: false });
  assert.equal(localBlocked.safe, false, 'Localhost must be blocked by default');

  // When allowLocal is explicitly enabled in development environment
  process.env.ALLOW_LOCAL_CRAWL = 'true';
  const localAllowed = await SSRFGuard.validateUrl('http://localhost:3000', { allowLocal: true });
  assert.equal(localAllowed.safe, true, 'Local development URL must be permitted under controlled policy');
  delete process.env.ALLOW_LOCAL_CRAWL;
});

// 4. Universal Crawler: JavaScript Rendering Fallback
test('GEO: 4. Universal Crawler browser rendering fallback graceful execution', async () => {
  // Should not crash even when Playwright is not installed in current environment
  const result = await BrowserRenderer.render('https://example.com');
  assert.ok(typeof result.html === 'string');
  assert.ok(result.html.length > 0);
  assert.equal(typeof result.rendered, 'boolean');
});

// 5. GEO: AI Engines Seed & Persistence
test('GEO: 5. AI Engines seeding and retrieval', async () => {
  const engines = await GEOService.getEngines();
  assert.ok(engines.length >= 4, 'Default engines must be seeded');
  const names = engines.map(e => e.name);
  assert.ok(names.some(n => n.includes('ChatGPT')));
  assert.ok(names.some(n => n.includes('Gemini')));
  assert.ok(names.some(n => n.includes('Perplexity')));
});

// 6. GEO: Visibility Prompts & Candidate Generation
test('GEO: 6. Visibility Prompts CRUD and Prompt Generation', async () => {
  const prompt = await GEOService.createPrompt({
    organizationId: orgId,
    promptText: 'Who are the leading AI development companies in India?',
    category: 'SERVICE',
    targetEntity: 'Webkorps'
  });
  assert.ok(prompt.id);
  assert.equal(prompt.prompt_text, 'Who are the leading AI development companies in India?');
  assert.equal(prompt.category, 'SERVICE');

  const list = await GEOService.getPrompts(orgId);
  assert.ok(list.length >= 1);

  // Prompt generator
  const candidates = await GEOService.generateCandidatePrompts(orgId);
  assert.ok(candidates.length >= 5, 'Should generate candidate queries across BRAND, SERVICE, LOCAL, etc.');
  assert.ok(candidates.some(c => c.category === 'BRAND'));
  assert.ok(candidates.some(c => c.category === 'SERVICE'));
});

// 7. GEO: Provider Unavailable (No Fake Data Policy)
test('GEO: 7. Provider unavailable state handling (Strictly NO FAKE DATA)', async () => {
  const prompt = await GEOService.createPrompt({
    organizationId: orgId,
    promptText: 'Unconfigured provider test prompt',
    category: 'GENERAL'
  });

  const run = await GEOService.queueObservationRun({
    organizationId: orgId,
    promptId: prompt.id
  });
  assert.equal(run.status, 'QUEUED');

  // Wait for async execution
  await new Promise(r => setTimeout(r, 200));

  const check = await db.query(`SELECT status, error_message FROM ai_observation_runs WHERE id = $1`, [run.id]);
  assert.equal(check.rows[0].status, 'PROVIDER_UNAVAILABLE', 'Unconfigured live AI provider must yield PROVIDER_UNAVAILABLE');
  assert.ok(check.rows[0].error_message.includes('not configured'));
});

// 8. GEO: Deterministic Observation Parsing (Mentions, Citations, Competitors)
test('GEO: 8. Deterministic parsing of brand mentions, recommendation signals, citations & competitors', () => {
  const sampleRawResponse = `
Here are the top AI and software development companies in India:

1. **Persistent Systems** - A major industry player specializing in enterprise software and cloud digital solutions. See [Persistent](https://www.persistentsys.com).
2. **Webkorps** - A highly recommended AI development company providing end-to-end custom software and enterprise intelligence solutions. Visit [Webkorps Services](https://webkorps.com/services) for more details.
3. **Tata Elxsi** - Leading engineering research and embedded AI design firm. Source: https://www.tataelxsi.com/ai

Overall, Webkorps is a strong choice for businesses seeking agile AI product development.
  `.trim();

  const parsed = ObservationParser.parse(sampleRawResponse, 'Webkorps', 'webkorps.com', ['Persistent Systems', 'Tata Elxsi']);

  // Target Mention
  assert.equal(parsed.targetMention.mentioned, true);
  assert.equal(parsed.targetMention.entityName, 'Webkorps');
  assert.equal(parsed.targetMention.recommendationSignal, true, 'Must detect recommendation signal');
  assert.ok(parsed.targetMention.position! >= 1);

  // Competitors
  assert.equal(parsed.competitors.length, 2);
  const compNames = parsed.competitors.map(c => c.competitorName);
  assert.ok(compNames.includes('Persistent Systems'));
  assert.ok(compNames.includes('Tata Elxsi'));

  // Citations
  assert.ok(parsed.citations.length >= 3);
  const targetCitation = parsed.citations.find(c => c.isTargetDomain);
  assert.ok(targetCitation, 'Must identify webkorps.com as owned target domain');
  assert.equal(targetCitation?.citedDomain, 'webkorps.com');

  const competitorCitation = parsed.citations.find(c => !c.isTargetDomain);
  assert.ok(competitorCitation);
  assert.equal(competitorCitation?.isTargetDomain, false);
});

// 9. GEO: Manual Observation Import & Opportunity Generation
test('GEO: 9. Manual observation import and automated opportunity discovery', async () => {
  const importedText = `
Top AI development firms in India:
1. Tata Elxsi is the premier AI design agency.
2. Infosys delivers scalable enterprise AI solutions.
Refer to https://industryreport.com/top-ai-firms for full data.
  `.trim();

  const importResult = await GEOService.importObservation({
    organizationId: orgId,
    engineName: 'ChatGPT',
    model: 'gpt-4o',
    promptText: 'Best AI development agencies in India 2026',
    rawResponse: importedText,
    targetEntity: 'Webkorps',
    competitors: ['Tata Elxsi', 'Infosys']
  });

  assert.equal(importResult.run.status, 'COMPLETED');
  assert.equal(importResult.parsed.targetMention.mentioned, false, 'Webkorps was not mentioned in this raw answer');
  assert.equal(importResult.parsed.competitors.length, 2);

  // Check that opportunities were generated because competitors were mentioned while target was omitted
  const opps = await GEOService.getOpportunities(orgId);
  assert.ok(opps.length > 0, 'Must generate GEO opportunities when competitors outrank target');
  const compOpps = opps.filter(o => o.opportunity_type === 'COMPETITOR_CITED' || o.opportunity_type === 'CONTENT_GAP');
  assert.ok(compOpps.length > 0);
});

// 10. GEO: Measurable Metrics Calculation & Tenant Isolation
test('GEO: 10. Empirical metrics calculation without fake scores, and strict tenant isolation', async () => {
  // Ingest a second observation where Webkorps is mentioned and cited
  await GEOService.importObservation({
    organizationId: orgId,
    engineName: 'Perplexity',
    model: 'sonar',
    promptText: 'Recommended custom software development in Indore',
    rawResponse: 'Webkorps is recommended as a leading firm in Indore: https://webkorps.com',
    targetEntity: 'Webkorps'
  });

  const summary = await GEOService.getSummary(orgId);
  assert.ok(summary.observations >= 2);
  assert.ok(typeof summary.mentionRate === 'number');
  assert.ok(typeof summary.recommendationRate === 'number');
  assert.ok(typeof summary.citationRate === 'number');
  assert.ok(typeof summary.ownedCitationRate === 'number');
  assert.ok(typeof summary.competitorMentionRate === 'number');
  // Ensure no fake score property
  assert.equal((summary as any).geoScore, undefined, 'Must NOT contain fake GEO score');

  // Tenant Isolation Check: Other tenant must see 0 observations
  const otherSummary = await GEOService.getSummary(otherOrgId);
  assert.equal(otherSummary.observations, 0, 'Tenant B must NOT see Tenant A observations');

  const otherOpps = await GEOService.getOpportunities(otherOrgId);
  assert.equal(otherOpps.length, 0, 'Tenant B must NOT see Tenant A opportunities');
});
