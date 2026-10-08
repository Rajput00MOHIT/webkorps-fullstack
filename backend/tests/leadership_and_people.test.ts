import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { db } from '../src/db/client.js';
import { AssistantService } from '../src/modules/assistant/assistantService.js';

describe('Webkorps Leadership, CEO & People Intelligence Test Suite', () => {
  const orgId = '00000000-0000-0000-0000-000000000001';

  test('01. Should accurately identify CEO of Webkorps', async () => {
    await db.ensureReady();
    const res = await AssistantService.ask(orgId, `test-ceo-${Date.now()}`, 'Who is the CEO of Webkorps?');
    assert.ok(res.answer.includes('Chirag Agrawal'), 'Must mention Chirag Agrawal');
    assert.ok(res.answer.includes('CEO') || res.answer.includes('Founder'), 'Must mention CEO role');
    assert.ok(res.answer.includes('[S1]') || res.answer.includes('[S2]'), 'Must include citation');
  });

  test('02. Should explain who Chirag Agrawal is', async () => {
    const res = await AssistantService.ask(orgId, `test-chirag-${Date.now()}`, 'Who is Chirag Agrawal?');
    assert.ok(res.answer.includes('Chirag Agrawal'), 'Must mention Chirag Agrawal');
    assert.ok(res.answer.includes('CEO') || res.answer.includes('Founder'), 'Must identify as CEO & Founder');
  });

  test('03. Should accurately identify COO and Co-founder', async () => {
    const res = await AssistantService.ask(orgId, `test-coo-${Date.now()}`, 'Who is the COO of Webkorps?');
    assert.ok(res.answer.includes('Amul Choudhary'), 'Must mention Amul Choudhary');
    assert.ok(res.answer.includes('COO') || res.answer.includes('Co-Founder'), 'Must identify as COO / Co-Founder');
  });

  test('04. Should explain who Amul Choudhary is', async () => {
    const res = await AssistantService.ask(orgId, `test-amul-${Date.now()}`, 'Who is Amul Choudhary?');
    assert.ok(res.answer.includes('Amul Choudhary'), 'Must mention Amul Choudhary');
    assert.ok(res.answer.includes('COO') || res.answer.includes('Co-Founder'), 'Must identify role');
  });

  test('05. Should provide comprehensive executive leadership overview', async () => {
    const res = await AssistantService.ask(orgId, `test-lead-${Date.now()}`, 'Tell me about the leadership team and management at Webkorps');
    assert.ok(res.answer.includes('Chirag Agrawal'), 'Must include Chirag Agrawal');
    assert.ok(res.answer.includes('Amul Choudhary'), 'Must include Amul Choudhary');
    assert.ok(res.answer.includes('400+'), 'Must mention engineering team size');
  });

  test('06. Should handle Hinglish query for CEO', async () => {
    const res = await AssistantService.ask(orgId, `test-ceo-hi-${Date.now()}`, 'Webkorps ka CEO kaun hai?');
    assert.ok(res.answer.includes('Chirag Agrawal'), 'Must mention Chirag Agrawal in Hinglish response');
  });

  test('07. Should handle Hinglish query for founders and people', async () => {
    const res = await AssistantService.ask(orgId, `test-found-hi-${Date.now()}`, 'Webkorps ke founders kaun hain aur kitne log kaam karte hain?');
    assert.ok(res.answer.includes('Chirag Agrawal'), 'Must mention Chirag Agrawal');
    assert.ok(res.answer.includes('Amul Choudhary'), 'Must mention Amul Choudhary');
  });

  test('08. Should accurately state team size and engineer count', async () => {
    const res = await AssistantService.ask(orgId, `test-team-${Date.now()}`, 'How many engineers and people work at Webkorps?');
    assert.ok(res.answer.includes('400+'), 'Must state 400+ engineers');
  });
});
