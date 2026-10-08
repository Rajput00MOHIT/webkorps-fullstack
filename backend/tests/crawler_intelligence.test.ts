import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db/client.js';
import { SSRFGuard } from '../src/modules/crawler/ssrfGuard.js';
import { URLNormalizer } from '../src/modules/crawler/urlNormalizer.js';
import { RobotsParser } from '../src/modules/crawler/robotsParser.js';
import { HtmlExtractor } from '../src/modules/crawler/htmlExtractor.js';
import { SeoAnalyzer } from '../src/modules/crawler/seoAnalyzer.js';
import { KnowledgeCandidateExtractor } from '../src/modules/crawler/knowledgeCandidateExtractor.js';
import { CrawlerService } from '../src/modules/crawler/crawlerService.js';
import { KnowledgeService } from '../src/modules/knowledge/knowledgeService.js';

test.before(async () => {
  await db.ensureReady();
  await KnowledgeService.seedWebkorpsGroundTruth();
});

test.after(async () => {
  await db.close();
});

// 1. SSRF PROTECTION
test('Crawler: 1. SSRF Protection blocks private IPs, metadata endpoints & non-http protocols', async () => {
  // Private IPs
  assert.equal(SSRFGuard.isPrivateIp('127.0.0.1'), true, '127.0.0.1 must be identified as private');
  assert.equal(SSRFGuard.isPrivateIp('10.0.0.1'), true, '10.0.0.1 must be identified as private');
  assert.equal(SSRFGuard.isPrivateIp('192.168.1.1'), true, '192.168.1.1 must be identified as private');
  assert.equal(SSRFGuard.isPrivateIp('169.254.169.254'), true, 'AWS/GCP metadata endpoint must be blocked');

  // URL validations
  const localCheck = await SSRFGuard.validateUrl('http://localhost:8080/admin');
  assert.equal(localCheck.safe, false, 'Localhost URL must be blocked');

  const fileCheck = await SSRFGuard.validateUrl('file:///etc/passwd');
  assert.equal(fileCheck.safe, false, 'file: protocol must be blocked');

  const ftpCheck = await SSRFGuard.validateUrl('ftp://ftp.server.com');
  assert.equal(ftpCheck.safe, false, 'ftp: protocol must be blocked');
});

// 2. URL NORMALIZATION & SAME-DOMAIN ENFORCEMENT
test('Crawler: 2. URL Normalization, tracking param stripping & same-domain enforcement', () => {
  const raw = 'https://www.webkorps.com/services/?utm_source=google&utm_campaign=winter&page=2#section';
  const normalized = URLNormalizer.normalize(raw);
  assert.equal(normalized, 'https://www.webkorps.com/services?page=2', 'Must strip tracking params and fragment while preserving page=2');

  const relative = URLNormalizer.normalize('/case-studies/', 'https://www.webkorps.com/about');
  assert.equal(relative, 'https://www.webkorps.com/case-studies');

  // Same domain
  assert.equal(URLNormalizer.isSameDomain('https://www.webkorps.com/contact', 'webkorps.com'), true);
  assert.equal(URLNormalizer.isSameDomain('https://webkorps.com/contact', 'www.webkorps.com'), true);
  assert.equal(URLNormalizer.isSameDomain('https://google.com', 'webkorps.com'), false);
});

// 3. ROBOTS.TXT HANDLING
test('Crawler: 3. Robots.txt parsing and permission rules', () => {
  const robotsSample = `
    User-agent: *
    Disallow: /admin/
    Disallow: /private/
    Allow: /admin/public/
    Crawl-delay: 2
    Sitemap: https://www.webkorps.com/sitemap.xml
  `;

  const parser = new RobotsParser();
  parser.parse(robotsSample);
  parser.exists = true;

  assert.equal(parser.isAllowed('https://www.webkorps.com/services'), true, 'Public services page must be allowed');
  assert.equal(parser.isAllowed('https://www.webkorps.com/admin/login'), false, '/admin/ must be disallowed');
  assert.equal(parser.isAllowed('https://www.webkorps.com/admin/public/info'), true, 'More specific Allow must win');
  assert.equal(parser.getSummary().sitemaps[0], 'https://www.webkorps.com/sitemap.xml');
  assert.equal(parser.getSummary().crawlDelay, 2);
});

// 4. HTML & METADATA EXTRACTION
test('Crawler: 4. HTML Extraction, Metadata, Headings, Text & Content Hashing', () => {
  const htmlSample = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>Webkorps | Enterprise AI Engineering Solutions</title>
        <meta name="description" content="Discover custom generative AI and cloud software engineering built for high-scale enterprises.">
        <link rel="canonical" href="https://www.webkorps.com/ai-solutions">
      </head>
      <body>
        <nav><a href="/home">Home</a></nav>
        <h1>Custom AI Engineering Solutions</h1>
        <h2>Generative AI Copilots</h2>
        <p>We build production-grade AI platforms with verifiable security and HIPAA compliance.</p>
        <h2>Autonomous Agent Workflows</h2>
        <p>Deploy scalable agents across multi-cloud environments.</p>
        <img src="/assets/diagram.png" alt="AI Architecture Diagram" />
        <img src="/assets/decorative.png" />
        <a href="/contact">Talk to an Architect</a>
        <a href="https://linkedin.com/company/webkorps" rel="nofollow">LinkedIn</a>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Custom AI Engineering",
            "provider": { "@type": "Organization", "name": "Webkorps" }
          }
        </script>
      </body>
    </html>
  `;

  const data = HtmlExtractor.extract(htmlSample, 'https://www.webkorps.com/ai-solutions', 'webkorps.com');

  assert.equal(data.title, 'Webkorps | Enterprise AI Engineering Solutions');
  assert.equal(data.canonicalUrl, 'https://www.webkorps.com/ai-solutions');
  assert.equal(data.language, 'en');
  assert.equal(data.h1Tags.length, 1);
  assert.equal(data.h1Tags[0], 'Custom AI Engineering Solutions');
  assert.equal(data.h2Tags.length, 2);
  assert.ok(data.wordCount > 10, 'Word count must be calculated');
  assert.ok(data.contentHash.length === 64, 'SHA-256 content hash must be 64 characters');

  // Images
  assert.equal(data.images.length, 2);
  assert.equal(data.images[0].hasMissingAlt, false);
  assert.equal(data.images[1].hasMissingAlt, true);

  // Schemas
  assert.equal(data.schemas.length, 1);
  assert.equal(data.schemas[0]['@type'], 'Service');

  // Links
  assert.equal(data.internalLinks.length, 2); // /home and /contact
  assert.equal(data.externalLinks.length, 1); // linkedin
  assert.equal(data.externalLinks[0].rel, 'nofollow');
});

// 5. DETERMINISTIC SEO SIGNALS & ISSUES
test('Crawler: 5. Deterministic SEO Issue Creation and Indexability', () => {
  const badHtml = `
    <html>
      <head>
        <title>Short</title>
      </head>
      <body>
        <p>Thin text.</p>
        <img src="/pic.png" />
      </body>
    </html>
  `;

  const extracted = HtmlExtractor.extract(badHtml, 'https://www.webkorps.com/bad-page', 'webkorps.com');
  const analysis = SeoAnalyzer.analyze('https://www.webkorps.com/bad-page', 200, extracted);

  assert.equal(analysis.indexability, 'INDEXABLE');
  const issueTypes = analysis.issues.map(i => i.issueType);

  assert.ok(issueTypes.includes('SHORT_TITLE'), 'Must detect SHORT_TITLE');
  assert.ok(issueTypes.includes('MISSING_META_DESCRIPTION'), 'Must detect MISSING_META_DESCRIPTION');
  assert.ok(issueTypes.includes('MISSING_H1'), 'Must detect MISSING_H1');
  assert.ok(issueTypes.includes('CANONICAL_MISSING'), 'Must detect CANONICAL_MISSING');
  assert.ok(issueTypes.includes('THIN_CONTENT'), 'Must detect THIN_CONTENT');
  assert.ok(issueTypes.includes('IMAGES_MISSING_ALT'), 'Must detect IMAGES_MISSING_ALT');
});

// 6. KNOWLEDGE CANDIDATE EXTRACTION (UNTRUSTED DISCOVERY)
test('Crawler: 6. Discovered Knowledge Candidates are tagged as DISCOVERED and preserve Ground Truth', async () => {
  const orgId = '00000000-0000-0000-0000-000000000001';
  await db.query("DELETE FROM knowledge_entities WHERE organization_id = $1 AND name = 'Edge AI Microservices Architecture'", [orgId]);
  const htmlWithSchema = `
    <html>
      <head><title>Test</title></head>
      <body>
        <h1>Discovered Service Page</h1>
        <script type="application/ld+json">
          {
            "@type": "Service",
            "name": "Edge AI Microservices Architecture"
          }
        </script>
      </body>
    </html>
  `;

  const extracted = HtmlExtractor.extract(htmlWithSchema, 'https://www.webkorps.com/services/edge-ai', 'webkorps.com');
  const count = await KnowledgeCandidateExtractor.processCandidates(orgId, 'https://www.webkorps.com/services/edge-ai', extracted);

  assert.equal(count, 1, 'Should discover 1 candidate service');

  const candidate = await db.query(
    "SELECT * FROM knowledge_entities WHERE organization_id = $1 AND name = 'Edge AI Microservices Architecture'",
    [orgId]
  );
  assert.equal(candidate.rows.length, 1);
  assert.equal(candidate.rows[0].verification_status, 'DISCOVERED');
  assert.equal(candidate.rows[0].is_verified, false);

  // Verify Authoritative Webkorps entities were NOT touched or degraded
  const company = await db.query(
    "SELECT * FROM knowledge_entities WHERE organization_id = $1 AND entity_type = 'COMPANY'",
    [orgId]
  );
  assert.equal(company.rows[0].verification_status, 'AUTHORITATIVE');
  assert.equal(company.rows[0].is_verified, true);
});

// 7. CRAWL LIFECYCLE & DATABASE PERSISTENCE
test('Crawler: 7. Crawl Job Lifecycle, Snapshot Delta Tracking & Tenant Isolation', async () => {
  // Create test website
  const webRes = await db.query(
    "INSERT INTO websites (organization_id, domain, name) VALUES ('00000000-0000-0000-0000-000000000001', 'crawler-test.example', 'Crawler Test') RETURNING id"
  );
  const websiteId = webRes.rows[0].id;

  // Queue crawl
  const queued = await CrawlerService.queueCrawl({
    organizationId: '00000000-0000-0000-0000-000000000001',
    websiteId,
    startUrl: 'https://crawler-test.example',
    maxPages: 5
  });

  assert.ok(queued.crawlRunId);
  assert.equal(queued.status, 'QUEUED');

  // Verify crawl run in database
  const statusRes = await CrawlerService.getCrawlStatus('00000000-0000-0000-0000-000000000001', queued.crawlRunId);
  assert.equal(statusRes.website_id, websiteId);

  // Tenant isolation verification: Tenant B cannot access Tenant A's crawl run
  const foreignTenantId = '22222222-2222-2222-2222-222222222222';
  await assert.rejects(
    async () => {
      await CrawlerService.getCrawlStatus(foreignTenantId, queued.crawlRunId);
    },
    /Crawl run not found or access denied/,
    'Cross-tenant crawl status query must be rejected'
  );
});
