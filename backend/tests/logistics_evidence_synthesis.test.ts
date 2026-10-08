import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db/client.js';
import { AssistantService } from '../src/modules/assistant/assistantService.js';
import { ingestAllCrawledIntelligence } from '../src/modules/knowledge/ingestCrawledKnowledge.js';

const TEST_ORG_ID = '00000000-0000-0000-0000-000000000001';

test.before(async () => {
  await db.ensureReady();
  await db.query(
    `INSERT INTO organizations (id, name, slug) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
    [TEST_ORG_ID, 'Webkorps', 'webkorps']
  );
  await ingestAllCrawledIntelligence();
});

test('CORP TALK CRITICAL FIX SUITE', async (t) => {
  await t.test('1. Direct Logistics Work Question (Must cite Cryoport and cold-chain, no broken templates)', async () => {
    const sess = `logistics-test-1-${Date.now()}`;
    const res = await AssistantService.ask(TEST_ORG_ID, sess, 'Any work done in logistics?');
    
    console.log('\n[TEST 1 ANSWER]:\n', res.answer);

    assert.ok(res.answer.toLowerCase().includes('cryoport') || res.answer.toLowerCase().includes('logistics'), 'Must reference Cryoport or logistics');
    assert.ok(!res.answer.toLowerCase().includes('related to logistic'), 'Must NEVER contain "related to logistic"');
    assert.ok(!res.answer.toLowerCase().includes('your related to'), 'Must NEVER contain "your related to"');
    assert.ok(res.answer.includes('[S1]'), 'Must include inline citation tag [S1]');
  });

  await t.test('2. Has Webkorps built a logistics application?', async () => {
    const sess = `logistics-test-2-${Date.now()}`;
    const res = await AssistantService.ask(TEST_ORG_ID, sess, 'Has Webkorps built a logistics application?');
    
    console.log('\n[TEST 2 ANSWER]:\n', res.answer);

    assert.ok(res.answer.toLowerCase().includes('cryoport') || res.answer.toLowerCase().includes('iot'), 'Must reference verified case study');
    assert.ok(!res.answer.includes('related to logistic'));
  });

  await t.test('3. Which logistics projects has Webkorps worked on?', async () => {
    const sess = `logistics-test-3-${Date.now()}`;
    const res = await AssistantService.ask(TEST_ORG_ID, sess, 'Which logistics projects has Webkorps worked on?');
    
    console.log('\n[TEST 3 ANSWER]:\n', res.answer);

    assert.ok(res.answer.toLowerCase().includes('cryoport'), 'Must identify Cryoport project');
  });

  await t.test('4. What technologies were used in logistics?', async () => {
    const sess = `logistics-test-4-${Date.now()}`;
    const res = await AssistantService.ask(TEST_ORG_ID, sess, 'What technologies does Webkorps use for logistics platforms?');
    
    console.log('\n[TEST 4 ANSWER]:\n', res.answer);

    assert.ok(res.answer.toLowerCase().includes('flutter') || res.answer.toLowerCase().includes('node.js') || res.answer.toLowerCase().includes('postgis'), 'Must cite verified tech stack');
  });

  await t.test('5. Multi-Turn Context: Logistics -> Topic Switch to Company CEO (Must NOT leak logistics)', async () => {
    const sess = `multiturn-switch-${Date.now()}`;
    
    // Turn 1
    const t1 = await AssistantService.ask(TEST_ORG_ID, sess, 'I want to build a fleet tracking app.');
    console.log('\n[TURN 1 ANSWER]:\n', t1.answer.slice(0, 120));

    // Turn 2
    const t2 = await AssistantService.ask(TEST_ORG_ID, sess, 'Who is the CEO of Webkorps?');
    console.log('\n[TURN 2 ANSWER]:\n', t2.answer);

    assert.ok(t2.answer.includes('Chirag Agrawal'), 'Must identify CEO Chirag Agrawal');
    assert.ok(!t2.answer.toLowerCase().includes('in logistics'), 'Must NOT append "in logistics" to CEO query');
  });

  await t.test('6. Custom App Request: Coffee Shop App (Must NOT mention logistics or broken templates)', async () => {
    const sess = `coffee-test-${Date.now()}`;
    const res = await AssistantService.ask(TEST_ORG_ID, sess, 'how webkorps help me in my coffe shop app');
    
    console.log('\n[COFFEE SHOP ANSWER]:\n', res.answer);

    assert.ok(res.answer.toLowerCase().includes('coffee') || res.answer.toLowerCase().includes('restaurant'), 'Must address coffee shop / food app');
    assert.ok(!res.answer.toLowerCase().includes('related to logistic'), 'Must NOT have broken logistics substitution');
    assert.ok(!res.answer.toLowerCase().includes('your related to'));
  });

  await t.test('7. Fictional Trap: Did Webkorps build Uber?', async () => {
    const sess = `trap-test-${Date.now()}`;
    const res = await AssistantService.ask(TEST_ORG_ID, sess, 'Did Webkorps build Uber?');
    
    console.log('\n[UBER TRAP ANSWER]:\n', res.answer);

    assert.ok(res.answer.toLowerCase().includes('no') || res.answer.toLowerCase().includes('did not build'), 'Must reject fictional claim');
  });

  await t.test('8. Commercial Pricing Request', async () => {
    const sess = `pricing-test-${Date.now()}`;
    const res = await AssistantService.ask(TEST_ORG_ID, sess, 'How much does Webkorps charge to build an app?');
    
    console.log('\n[PRICING ANSWER]:\n', res.answer);

    assert.ok(res.answer.toLowerCase().includes('dedicated') || res.answer.toLowerCase().includes('milestone') || res.answer.toLowerCase().includes('time & materials'), 'Must explain engagement models');
  });
});
