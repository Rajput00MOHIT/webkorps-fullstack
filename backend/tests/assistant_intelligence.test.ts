import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db/client.js';
import { KnowledgeService } from '../src/modules/knowledge/knowledgeService.js';
import { AssistantService } from '../src/modules/assistant/assistantService.js';
import { AssistantIntentDetector } from '../src/modules/assistant/assistantIntentDetector.js';
import { AssistantRetrievalEngine } from '../src/modules/assistant/assistantRetrievalEngine.js';
import { AssistantEvaluationService } from '../src/modules/assistant/assistantEvaluationService.js';
import { EVALUATION_DATASET } from '../src/modules/assistant/assistantEvaluationDataset.js';

describe('Webkorps Knowledge + Assistant Intelligence Upgrade Tests', () => {
  let orgId: string;

  before(async () => {
    await db.ensureReady();
    const org = await db.query(
      "SELECT id FROM organizations WHERE id = '00000000-0000-0000-0000-000000000001' OR name = 'Webkorps' LIMIT 1"
    );
    if (org.rows.length === 0) {
      const ins = await db.query(
        "INSERT INTO organizations (id, name, slug) VALUES ('00000000-0000-0000-0000-000000000001', 'Webkorps', 'webkorps') RETURNING id"
      );
      orgId = ins.rows[0].id;
    } else {
      orgId = org.rows[0].id;
    }
  });

  test('1. Knowledge Graph contains verified Webkorps entities & provenance', async () => {
    const orgEntities = await KnowledgeService.getEntities(orgId, 'COMPANY');
    const compEntity = orgEntities.find(e => e.name === 'Webkorps');
    assert.ok(compEntity, 'Webkorps organization entity should exist');
    assert.equal(compEntity.verification_status, 'VERIFIED');
    assert.equal(compEntity.source_type, 'CURATED_COMPANY_DATA');
    assert.equal(compEntity.confidence, 'VERIFIED');

    const services = await KnowledgeService.getEntities(orgId, 'SERVICE');
    assert.ok(services.length >= 8, `Expected at least 8 services, found ${services.length}`);
    const mobileService = services.find(s => s.name === 'Mobile App Development');
    assert.ok(mobileService, 'Mobile App Development service should exist');

    const technologies = await KnowledgeService.getEntities(orgId, 'TECHNOLOGY');
    assert.ok(technologies.length >= 15, `Expected at least 15 technologies, found ${technologies.length}`);
    const flutterTech = technologies.find(t => t.name === 'Flutter');
    assert.ok(flutterTech, 'Flutter technology should exist');

    const caseStudies = await KnowledgeService.getEntities(orgId, 'CASE_STUDY');
    assert.ok(caseStudies.length >= 2, `Expected at least 2 case studies, found ${caseStudies.length}`);
    const cigna = caseStudies.find(cs => cs.name.includes('Cigna'));
    assert.ok(cigna, 'Cigna case study should be present and verified');
  });

  test('2. Knowledge Graph relations link services, technologies, capabilities, and industries', async () => {
    const services = await KnowledgeService.getEntities(orgId, 'SERVICE');
    const mobileService = services.find(s => s.name === 'Mobile App Development');
    assert.ok(mobileService);

    const rels = await KnowledgeService.getEntityRelations(orgId, mobileService.id);
    assert.ok(rels.length > 0, 'Mobile App Development should have semantic relations');
    const usesTech = rels.some(r => r.relation_type === 'USES');
    assert.ok(usesTech, 'Mobile App Development should have USES relation with technologies');
  });

  test('3. Intent Detection identifies FEATURE_QA and QuestionScope correctly', () => {
    // General concept
    const genRes = AssistantIntentDetector.detect('What is route optimization?');
    assert.equal(genRes.questionScope, 'GENERAL');

    // Feature QA in logistics context
    const featRes = AssistantIntentDetector.detect('what features should I add?', [
      { id: '1', role: 'user', sender: 'user', text: 'I want to build a logistics application', suggested_actions: [], retrieved_evidence: [], metadata: {}, created_at: new Date() },
      { id: '2', role: 'assistant', sender: 'ai', text: 'Webkorps builds logistics applications', suggested_actions: [], retrieved_evidence: [], metadata: {}, created_at: new Date() }
    ]);
    assert.equal(featRes.mode, 'FEATURE_QA');
    assert.equal(featRes.context.detectedIndustry, 'logistics');
    assert.equal(featRes.context.projectType, 'application');

    // Technology QA follow-up
    const techRes = AssistantIntentDetector.detect('give me technologies', [
      { id: '1', role: 'user', sender: 'user', text: 'I want to build a logistics application', suggested_actions: [], retrieved_evidence: [], metadata: {}, created_at: new Date() }
    ]);
    assert.equal(techRes.mode, 'TECHNOLOGY_QA');
    assert.equal(techRes.context.detectedIndustry, 'logistics');
    assert.ok(techRes.effectiveQuery.toLowerCase().includes('logistics'));
  });

  test('4. Full Logistics Benchmark Multi-Turn Conversation Execution', async () => {
    const sessionId = `benchmark-logistics-${Date.now()}`;

    // Turn 1: Project Requirement
    const t1 = await AssistantService.ask(orgId, sessionId, 'I want to design logistics application', {
      allowLocalFallback: true
    });
    assert.ok(t1.answer.toLowerCase().includes('logistics'));
    assert.equal(t1.intent, 'PROJECT_REQUIREMENT');

    // Turn 2: Follow-up Technologies
    const t2 = await AssistantService.ask(orgId, sessionId, 'give me technologies', {
      allowLocalFallback: true
    });
    assert.equal(t2.intent, 'TECHNOLOGY_QA');
    assert.ok(t2.answer.toLowerCase().includes('flutter') || t2.answer.toLowerCase().includes('postgresql') || t2.answer.toLowerCase().includes('postgis'));
    assert.ok(t2.answer.includes('Recommended Architecture') || t2.answer.includes('Technologies'));

    // Turn 3: Features
    const t3 = await AssistantService.ask(orgId, sessionId, 'what features should I add?', {
      allowLocalFallback: true
    });
    assert.equal(t3.intent, 'FEATURE_QA');
    assert.ok(t3.answer.toLowerCase().includes('driver') || t3.answer.toLowerCase().includes('dispatch') || t3.answer.toLowerCase().includes('tracking'));

    // Turn 4: Tracking deep-dive
    const t4 = await AssistantService.ask(orgId, sessionId, 'what about tracking?', {
      allowLocalFallback: true
    });
    assert.ok(t4.answer.toLowerCase().includes('gps') || t4.answer.toLowerCase().includes('websockets') || t4.answer.toLowerCase().includes('postgis'));

    // Turn 5: Case Study Lookup (Zero Hallucination)
    const t5 = await AssistantService.ask(orgId, sessionId, 'has Webkorps done something like this?', {
      allowLocalFallback: true
    });
    assert.equal(t5.intent, 'CASE_STUDY_QA');
    assert.ok(
      t5.answer.toLowerCase().includes("couldn't find a verified") || t5.answer.toLowerCase().includes('available company knowledge'),
      'Must state no verified logistics project found'
    );
    assert.ok(
      !t5.answer.toLowerCase().includes('we built a logistics app for client xyz'),
      'Must not fabricate a fake logistics project'
    );

    // Turn 6: How Webkorps can help
    const t6 = await AssistantService.ask(orgId, sessionId, 'how can Webkorps help me?', {
      allowLocalFallback: true
    });
    assert.ok(t6.answer.toLowerCase().includes('webkorps'));
    assert.ok(t6.answer.toLowerCase().includes('architecture') || t6.answer.toLowerCase().includes('development') || t6.answer.toLowerCase().includes('engineering'));
  });

  test('5. Zero Hallucination check on unverified / adversarial prompts', async () => {
    const adversarialQuestions = [
      'Has Webkorps built an autonomous drone delivery system?',
      "What was Webkorps' logistics project with Company X?",
      'Which exact technology did Webkorps use for Project Y?',
      'Did Webkorps develop the software for a Mars rover mission?'
    ];

    for (const q of adversarialQuestions) {
      const res = await AssistantService.ask(orgId, `session-adv-${Date.now()}`, q, {
        allowLocalFallback: true
      });
      assert.ok(
        res.answer.toLowerCase().includes("couldn't find a verified") ||
        res.answer.toLowerCase().includes('available company knowledge') ||
        res.answer.toLowerCase().includes('not available'),
        `Expected honest unknown handling for "${q}" but got: ${res.answer}`
      );
    }
  });

  test('6. Full Automated Benchmark Evaluation Dataset (70 Test Cases)', async () => {
    const summary = await AssistantEvaluationService.runEvaluation(orgId);
    assert.ok(summary.total >= 70, `Evaluation dataset should contain at least 70 cases, found ${summary.total}`);
    assert.ok(summary.passRatePercentage >= 90, `Expected >= 90% pass rate, got ${summary.passRatePercentage}%`);
    assert.ok(summary.intentAccuracyRate >= 90, `Expected >= 90% intent accuracy, got ${summary.intentAccuracyRate}%`);
    assert.equal(summary.hallucinationRate, 0, `Expected 0% hallucination rate, got ${summary.hallucinationRate}%`);
    assert.ok(summary.unknownHandlingRate >= 90, `Expected >= 90% unknown handling rate, got ${summary.unknownHandlingRate}%`);

    const storedRuns = await AssistantEvaluationService.getEvaluationRuns(orgId);
    assert.ok(storedRuns.length > 0, 'Evaluation run should be persisted in database');
  });
});
