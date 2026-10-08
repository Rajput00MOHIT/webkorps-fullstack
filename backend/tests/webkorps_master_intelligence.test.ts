import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db/client.js';
import { KnowledgeService } from '../src/modules/knowledge/knowledgeService.js';
import { KnowledgeIngestionEngine } from '../src/modules/knowledge/knowledgeIngestionEngine.js';
import { PageClassifier } from '../src/modules/crawler/pageClassifier.js';
import { AssistantService } from '../src/modules/assistant/assistantService.js';
import { AssistantRetrievalEngine } from '../src/modules/assistant/assistantRetrievalEngine.js';
import { ResearchService } from '../src/modules/research/researchService.js';

const WEBKORPS_ORG_ID = '00000000-0000-0000-0000-000000000001';

describe('Corp Talk: Webkorps Master Knowledge Intelligence & Runtime System', () => {
  before(async () => {
    await db.ensureReady();
    await KnowledgeService.seedWebkorpsGroundTruth(false);
  });

  // =========================================================================
  // 1. PAGE CLASSIFICATION & DETERMINISTIC SIGNALS
  // =========================================================================
  describe('1. Page Classification Engine', () => {
    it('classifies home, services, case studies, technologies, industries, and faqs', () => {
      const home = PageClassifier.classify('https://www.webkorps.com/', 'Enterprise Digital Transformation');
      assert.equal(home.pageType, 'HOME');

      const service = PageClassifier.classify('https://www.webkorps.com/services/mobile-app-development', 'Mobile App Development Services');
      assert.equal(service.pageType, 'SERVICE');

      const caseStudy = PageClassifier.classify('https://www.webkorps.com/case-studies/cryoport-logistics', 'Cryoport Logistics Platform');
      assert.equal(caseStudy.pageType, 'CASE_STUDY');

      const tech = PageClassifier.classify('https://www.webkorps.com/technologies/flutter', 'Flutter Development Company');
      assert.equal(tech.pageType, 'TECHNOLOGY');

      const industry = PageClassifier.classify('https://www.webkorps.com/industries/healthcare', 'Healthcare Software Solutions');
      assert.equal(industry.pageType, 'INDUSTRY');

      const faq = PageClassifier.classify('https://www.webkorps.com/faqs', 'Frequently Asked Questions');
      assert.equal(faq.pageType, 'FAQ');
    });
  });

  // =========================================================================
  // 2. KNOWLEDGE INGESTION, CONFLICT DETECTION & SEMANTIC CHUNKS
  // =========================================================================
  describe('2. Structured Ingestion, Semantic Chunks & Conflict Storage', () => {
    it('ingests a crawled page into structured entities, semantic chunks, and pgvector embeddings', async () => {
      const result = await KnowledgeIngestionEngine.ingestPage({
        organizationId: WEBKORPS_ORG_ID,
        url: 'https://www.webkorps.com/case-studies/cryoport',
        title: 'Cryoport Logistics & Supply Chain Case Study | Webkorps',
        headings: {
          h1: ['Cryoport Cold-Chain Logistics Platform'],
          h2: ['Problem Statement', 'Architecture & Solution', 'Business Impact'],
          h3: ['Real-Time GPS Telemetry', 'PostGIS Geofencing']
        },
        cleanText: `Cryoport specializes in temperature-controlled cold chain logistics for pharmaceutical shipments.
        Webkorps engineered real-time GPS telemetry tracking using Node.js microservices, PostgreSQL PostGIS spatial indexing, and React dashboards.
        The system handles high-concurrency sensor streaming via MQTT and WebSockets. Delivered 99.99% tracking reliability and automated dispatch routes.`
      });

      assert.equal(result.pageType, 'CASE_STUDY');
      assert.ok(result.chunksCount > 0, 'Should generate semantic chunks');

      // Verify chunks in DB
      const chunks = await db.query(
        `SELECT count(*) FROM knowledge_chunks WHERE organization_id = $1 AND source_url LIKE '%cryoport%'`,
        [WEBKORPS_ORG_ID]
      );
      assert.ok(parseInt(chunks.rows[0].count, 10) > 0, 'Chunks should be persisted in DB');
    });

    it('detects and records data conflicts between contradictory page claims', async () => {
      await KnowledgeIngestionEngine.recordConflict(
        WEBKORPS_ORG_ID,
        'HEADCOUNT',
        'Webkorps Developer Headcount',
        'https://www.webkorps.com/legacy-page',
        '250+ professionals',
        'https://www.webkorps.com/about-us',
        '400+ developers',
        'NEWEST_SOURCE',
        '400+ developers'
      );

      const conflicts = await db.query(
        `SELECT * FROM knowledge_conflicts WHERE organization_id = $1 AND claim_type = 'HEADCOUNT'`,
        [WEBKORPS_ORG_ID]
      );
      assert.ok(conflicts.rows.length > 0, 'Conflict should be logged');
      assert.equal(conflicts.rows[0].source_b_value, '400+ developers');
    });
  });

  // =========================================================================
  // 3. MULTI-REPRESENTATION HYBRID RETRIEVAL & QUERY EXPANSION
  // =========================================================================
  describe('3. Multi-Representation Hybrid Retrieval & Query Expansion', () => {
    it('generates multi-faceted query expansions and retrieves evidence across KG, chunks, and vector store', async () => {
      const retrieval = await AssistantRetrievalEngine.retrieve({
        organizationId: WEBKORPS_ORG_ID,
        query: 'Can Webkorps build a logistics tracking app?',
        intent: 'SERVICE_QA',
        context: {
          detectedIndustry: 'logistics',
          technology: 'flutter'
        }
      });

      assert.ok(retrieval.items.length > 0, 'Should retrieve relevant items');
      assert.ok(retrieval.queryExpansions && retrieval.queryExpansions.length > 1, 'Should expand queries');
      assert.equal(retrieval.confidence, 'HIGH');
    });
  });

  // =========================================================================
  // 4. RUNTIME RESEARCH GATEKEEPER
  // =========================================================================
  describe('4. Smart Runtime Web Research Gatekeeper', () => {
    it('executes runtime web search when freshness is explicitly requested', async () => {
      const results = await ResearchService.performRuntimeWebSearch(
        WEBKORPS_ORG_ID,
        'Webkorps recent news and software engineering partnerships',
        3
      );
      assert.ok(Array.isArray(results), 'Should return research array');
    });
  });

  // =========================================================================
  // 5. MASTER ACCEPTANCE TEST 1 (Logistics Multi-Turn Flow)
  // =========================================================================
  describe('5. Master Acceptance Test 1: Full Logistics Multi-Turn Lifecycle', () => {
    it('correctly transitions: PROJECT_REQUIREMENT -> TECHNOLOGY -> FEATURE -> SERVICE -> CASE_STUDY -> PRICING -> CONTACT/LEAD', async () => {
      const sessionId = `master-flow-1-${Date.now()}`;

      // Turn 1: Project Requirement
      const t1 = await AssistantService.ask(WEBKORPS_ORG_ID, sessionId, 'I want to build a logistics application.');
      assert.equal(t1.intent, 'PROJECT_REQUIREMENT');
      assert.ok(t1.answer.toLowerCase().includes('logistics'));

      // Turn 2: Technology Recommendation
      const t2 = await AssistantService.ask(WEBKORPS_ORG_ID, sessionId, 'What technologies should I use?');
      assert.ok(['TECHNOLOGY_QA', 'SERVICE_QA', 'PROJECT_REQUIREMENT'].includes(t2.intent));
      assert.ok(t2.answer.toLowerCase().includes('flutter') || t2.answer.toLowerCase().includes('react native') || t2.answer.toLowerCase().includes('postgis'));

      // Turn 3: Feature Architecture
      const t3 = await AssistantService.ask(WEBKORPS_ORG_ID, sessionId, 'What features should it have?');
      assert.ok(['FEATURE_QA', 'PROJECT_REQUIREMENT', 'SERVICE_QA'].includes(t3.intent));
      assert.ok(t3.answer.toLowerCase().includes('dispatch') || t3.answer.toLowerCase().includes('tracking') || t3.answer.toLowerCase().includes('route'));

      // Turn 4: Webkorps Capability
      const t4 = await AssistantService.ask(WEBKORPS_ORG_ID, sessionId, 'Can Webkorps build this?');
      assert.ok(['SERVICE_QA', 'CAPABILITY_QA', 'PROJECT_REQUIREMENT'].includes(t4.intent));
      assert.ok(t4.answer.toLowerCase().includes('webkorps'));

      // Turn 5: Case Study Verification (Anti-hallucination)
      const t5 = await AssistantService.ask(WEBKORPS_ORG_ID, sessionId, 'Has Webkorps done anything similar?');
      assert.equal(t5.intent, 'CASE_STUDY_QA');

      // Turn 6: Pricing / Cost Transition
      const t6 = await AssistantService.ask(WEBKORPS_ORG_ID, sessionId, 'How much does Webkorps charge?');
      assert.ok(t6.intent === 'LEAD_INTENT' || t6.leadIntentSignal?.level !== 'NONE');
      assert.ok(t6.answer.toLowerCase().includes('engagement model') || t6.answer.toLowerCase().includes('milestone') || t6.answer.toLowerCase().includes('dedicated'));

      // Turn 7: Timeline
      const t7 = await AssistantService.ask(WEBKORPS_ORG_ID, sessionId, 'What about timeline?');
      assert.ok(t7.answer.length > 50);

      // Turn 8: Contact / Lead Handoff
      const t8 = await AssistantService.ask(WEBKORPS_ORG_ID, sessionId, 'Can I talk to someone?');
      assert.equal(t8.leadIntentSignal?.level, 'HIGH');
    });
  });

  // =========================================================================
  // 6. MASTER ACCEPTANCE TEST 2 (Context Switching: Company -> Healthcare)
  // =========================================================================
  describe('6. Master Acceptance Test 2: Context Replacement & Topic Switching', () => {
    it('switches context cleanly from General Company Knowledge to Healthcare Industry and Case Studies', async () => {
      const sessionId = `master-flow-2-${Date.now()}`;

      // Turn 1: Company
      const t1 = await AssistantService.ask(WEBKORPS_ORG_ID, sessionId, 'Tell me about Webkorps.');
      assert.equal(t1.intent, 'COMPANY_QA');
      assert.ok(t1.answer.toLowerCase().includes('400+') || t1.answer.toLowerCase().includes('digital engineering'));

      // Turn 2: Services
      const t2 = await AssistantService.ask(WEBKORPS_ORG_ID, sessionId, 'What services do you offer?');
      assert.equal(t2.intent, 'SERVICE_QA');

      // Turn 3: Technologies
      const t3 = await AssistantService.ask(WEBKORPS_ORG_ID, sessionId, 'What technologies do you use?');
      assert.equal(t3.intent, 'TECHNOLOGY_QA');

      // Turn 4: Topic Switch to Healthcare
      const t4 = await AssistantService.ask(WEBKORPS_ORG_ID, sessionId, 'Actually, tell me about healthcare.');
      assert.equal(t4.intent, 'INDUSTRY_QA');
      assert.ok(t4.answer.toLowerCase().includes('healthcare') || t4.answer.toLowerCase().includes('hipaa') || t4.answer.toLowerCase().includes('telehealth'));

      // Turn 5: Healthcare Case Studies (Sonic Healthcare / Cigna / Medhost)
      const t5 = await AssistantService.ask(WEBKORPS_ORG_ID, sessionId, 'Have you done healthcare projects?');
      assert.equal(t5.intent, 'CASE_STUDY_QA');
      assert.ok(t5.answer.toLowerCase().includes('sonic') || t5.answer.toLowerCase().includes('cigna') || t5.answer.toLowerCase().includes('medhost') || t5.answer.toLowerCase().includes('healthcare'));

      // Turn 6: Pricing
      const t6 = await AssistantService.ask(WEBKORPS_ORG_ID, sessionId, 'How much do you charge?');
      assert.ok(t6.intent === 'LEAD_INTENT' || t6.leadIntentSignal?.level !== 'NONE');
    });
  });

  // =========================================================================
  // 7. MASTER ACCEPTANCE TEST 3 (General vs Company Disambiguation)
  // =========================================================================
  describe('7. Master Acceptance Test 3: Distinguishing General vs Company-Specific Knowledge', () => {
    it('answers general questions directly and company questions with verified evidence', async () => {
      const sessionId = `master-flow-3-${Date.now()}`;

      // Turn 1: General Technology Question (What is Flutter?)
      const t1 = await AssistantService.ask(WEBKORPS_ORG_ID, sessionId, 'What is Flutter?');
      assert.ok(['GENERAL_GUIDANCE', 'TECHNOLOGY_QA'].includes(t1.intent));
      assert.ok(t1.answer.toLowerCase().includes('cross-platform') || t1.answer.toLowerCase().includes('framework') || t1.answer.toLowerCase().includes('flutter'));

      // Turn 2: Company Technology (Does Webkorps use Flutter?)
      const t2 = await AssistantService.ask(WEBKORPS_ORG_ID, sessionId, 'Does Webkorps use Flutter?');
      assert.equal(t2.intent, 'TECHNOLOGY_QA');
      assert.ok(t2.answer.toLowerCase().includes('webkorps') && t2.answer.toLowerCase().includes('flutter'));

      // Turn 3: Industries
      const t3 = await AssistantService.ask(WEBKORPS_ORG_ID, sessionId, 'What industries do you serve?');
      assert.equal(t3.intent, 'INDUSTRY_QA');
      assert.ok(t3.answer.toLowerCase().includes('fintech') && t3.answer.toLowerCase().includes('healthcare'));

      // Turn 4: Logistics Capability
      const t4 = await AssistantService.ask(WEBKORPS_ORG_ID, sessionId, 'Have you worked in logistics?');
      assert.ok(['CASE_STUDY_QA', 'INDUSTRY_QA', 'SERVICE_QA'].includes(t4.intent));
    });
  });

  // =========================================================================
  // 8. ANTI-HALLUCINATION & SECURITY GUARDRAILS
  // =========================================================================
  describe('8. Anti-Hallucination & Provenance Verification', () => {
    it('refuses to fabricate fictional case studies, revenue numbers, or clients', async () => {
      const sessionId = `hallucination-test-${Date.now()}`;

      const res1 = await AssistantService.ask(WEBKORPS_ORG_ID, sessionId, 'Did Webkorps build Uber?');
      assert.ok(
        res1.answer.toLowerCase().includes("could not find") ||
        res1.answer.toLowerCase().includes("couldn't find") ||
        res1.answer.toLowerCase().includes("no verified") ||
        res1.answer.toLowerCase().includes("not found in")
      );

      const res2 = await AssistantService.ask(WEBKORPS_ORG_ID, sessionId, 'What was Webkorps exact 2024 revenue with PayPal?');
      assert.ok(
        res2.answer.toLowerCase().includes("could not find") ||
        res2.answer.toLowerCase().includes("couldn't find") ||
        res2.answer.toLowerCase().includes("no verified") ||
        res2.answer.toLowerCase().includes("not available") ||
        res2.answer.toLowerCase().includes("confidential")
      );
    });
  });
});
