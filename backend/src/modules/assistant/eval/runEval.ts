import fs from 'fs';
import path from 'path';
import { db } from '../../../db/client.js';
import { AssistantService } from '../assistantService.js';
import { ASSISTANT_CONFIG } from '../config/assistantConfig.js';

interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface EvalQuestion {
  id: string;
  category: string;
  conversation: ConversationTurn[];
  expected_entities: string[];
  must_include: string[];
  must_not_include: string[];
  expected_behavior: 'answer' | 'refuse' | 'partial' | 'clarify';
}

interface EvalResult {
  id: string;
  category: string;
  query: string;
  passed: boolean;
  recallAt8: boolean;
  mrrScore: number;
  correctness: boolean;
  faithfulness: boolean;
  formatCheck: boolean;
  trapPass: boolean;
  answer: string;
  latencyMs: number;
  failureReasons: string[];
}

export async function runEvaluationHarness(organizationId: string = '00000000-0000-0000-0000-000000000001') {
  await db.ensureReady();

  const datasetPath = path.resolve('src/modules/assistant/eval/dataset.jsonl');
  const fileContent = fs.readFileSync(datasetPath, 'utf-8');
  const lines = fileContent.trim().split('\n').filter(Boolean);
  const questions: EvalQuestion[] = lines.map(l => JSON.parse(l));

  console.log(`\n======================================================`);
  console.log(`🚀 RUNNING CORP TALK SMART EVALUATION (${questions.length} TEST CASES)`);
  console.log(`🏢 Tenant: ${organizationId}`);
  console.log(`======================================================\n`);

  const results: EvalResult[] = [];
  const latencies: number[] = [];
  const mrrScores: number[] = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const sessionId = `eval-session-${q.id}-${Date.now()}`;
    const startTime = Date.now();

    try {
      let finalRes: any = null;
      let totalLatencyMs = 0;

      // Execute conversation turns sequentially
      for (const turn of q.conversation) {
        if (turn.role === 'user') {
          const tStart = Date.now();
          finalRes = await AssistantService.ask(organizationId, sessionId, turn.content);
          totalLatencyMs += (Date.now() - tStart);
        }
      }

      latencies.push(totalLatencyMs);
      const answer = finalRes?.answer || '';
      const ansLower = answer.toLowerCase();
      const reasons: string[] = [];

      // 1. Recall@8 & MRR Calculation
      let recallAt8 = true;
      let mrr = 0;
      const sources = finalRes?.sources || [];

      if (q.expected_entities.length > 0) {
        let firstMatchRank = -1;
        for (let sIdx = 0; sIdx < Math.min(sources.length, 8); sIdx++) {
          const sTitle = (sources[sIdx]?.title || '').toLowerCase();
          const matches = q.expected_entities.some(e => sTitle.includes(e.toLowerCase()));
          if (matches) {
            firstMatchRank = sIdx + 1;
            break;
          }
        }

        if (firstMatchRank > 0) {
          mrr = 1 / firstMatchRank;
        } else {
          // Check if entity appears in answer
          const inAnswer = q.expected_entities.some(e => ansLower.includes(e.toLowerCase()));
          if (inAnswer) {
            mrr = 0.5; // Half-credit if in answer
          } else {
            recallAt8 = false;
            reasons.push(`Recall@8 failed: None of [${q.expected_entities.join(', ')}] matched sources.`);
          }
        }
      } else {
        mrr = 1.0;
      }
      mrrScores.push(mrr);

      // 2. Correctness: Check must_include
      let correctness = true;
      if (q.must_include.length > 0) {
        const foundMustInclude = q.must_include.some(term => ansLower.includes(term.toLowerCase()));
        if (!foundMustInclude) {
          correctness = false;
          reasons.push(`Correctness failed: Missing required terms [${q.must_include.join(', ')}] in answer.`);
        }
      }

      // 3. Faithfulness: Check must_not_include
      let faithfulness = true;
      if (q.must_not_include.length > 0) {
        for (const badTerm of q.must_not_include) {
          if (ansLower.includes(badTerm.toLowerCase())) {
            faithfulness = false;
            reasons.push(`Faithfulness failed: Answer included forbidden term "${badTerm}".`);
          }
        }
      }

      // 4. Format Check: No raw JSON, brackets, or unrendered tokens
      let formatCheck = true;
      const rawTokens = ['[INDUSTRY]', '[COMPANY]', '[SERVICE]', '[TECHNOLOGY]', '{"', '"}', 'undefined', 'NaN', 'null:'];
      for (const tok of rawTokens) {
        if (answer.includes(tok)) {
          formatCheck = false;
          reasons.push(`Format check failed: Found unrendered artifact token "${tok}".`);
          break;
        }
      }

      // 5. Trap Pass Rate (Fictional / Confidential)
      let trapPass = true;
      if (q.category.startsWith('TRAP_') || q.expected_behavior === 'refuse') {
        const isRefusal =
          ansLower.includes("couldn't find") ||
          ansLower.includes('no verified') ||
          ansLower.includes('confidential') ||
          ansLower.includes('nda') ||
          ansLower.includes('never disclose') ||
          ansLower.includes('security governance') ||
          ansLower.includes('did not build');

        if (!isRefusal) {
          trapPass = false;
          reasons.push(`Trap test failed: Did not refuse or caution on unsupported/confidential claim.`);
        }
      }

      const passed = recallAt8 && correctness && faithfulness && formatCheck && trapPass;

      const lastTurn = q.conversation[q.conversation.length - 1].content;
      results.push({
        id: q.id,
        category: q.category,
        query: lastTurn,
        passed,
        recallAt8,
        mrrScore: mrr,
        correctness,
        faithfulness,
        formatCheck,
        trapPass,
        answer,
        latencyMs: totalLatencyMs,
        failureReasons: reasons
      });

      const icon = passed ? '✔' : '✖';
      console.log(`[${i + 1}/${questions.length}] ${icon} [${q.category}] "${lastTurn.slice(0, 45)}..." (${totalLatencyMs}ms)`);
      if (!passed) {
        console.log(`    ↳ Failure: ${reasons.join(' | ')}`);
      }
    } catch (err: any) {
      results.push({
        id: q.id,
        category: q.category,
        query: q.conversation[q.conversation.length - 1]?.content || '',
        passed: false,
        recallAt8: false,
        mrrScore: 0,
        correctness: false,
        faithfulness: false,
        formatCheck: false,
        trapPass: false,
        answer: `ERROR: ${err.message}`,
        latencyMs: 0,
        failureReasons: [`Exception: ${err.message}`]
      });
      console.log(`[${i + 1}/${questions.length}] ✖ [${q.category}] EXCEPTION: ${err.message}`);
    }
  }

  // Aggregate Metrics
  const total = results.length;
  const passedCount = results.filter(r => r.passed).length;
  const recallCount = results.filter(r => r.recallAt8).length;
  const avgMrr = mrrScores.reduce((a, b) => a + b, 0) / (mrrScores.length || 1);
  const correctnessCount = results.filter(r => r.correctness).length;
  const faithfulnessCount = results.filter(r => r.faithfulness).length;
  const formatCount = results.filter(r => r.formatCheck).length;
  const trapQuestions = results.filter(r => r.category.startsWith('TRAP_') || r.category === 'CONFIDENTIAL');
  const trapPassedCount = trapQuestions.filter(r => r.trapPass).length;

  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;

  const passRate = (passedCount / total) * 100;
  const recallRate = (recallCount / total) * 100;
  const correctnessRate = (correctnessCount / total) * 100;
  const faithfulnessRate = (faithfulnessCount / total) * 100;
  const formatRate = (formatCount / total) * 100;
  const trapPassRate = trapQuestions.length > 0 ? (trapPassedCount / trapQuestions.length) * 100 : 100;

  const summary = {
    total_test_cases: total,
    passed: passedCount,
    failed: total - passedCount,
    pass_rate: `${passRate.toFixed(1)}%`,
    recall_at_8: `${recallRate.toFixed(1)}% (Target: >= ${(ASSISTANT_CONFIG.eval.minRecallAt8 * 100).toFixed(0)}%)`,
    mrr: `${avgMrr.toFixed(3)} (Target: >= ${ASSISTANT_CONFIG.eval.minMrr.toFixed(2)})`,
    correctness: `${correctnessRate.toFixed(1)}% (Target: >= ${(ASSISTANT_CONFIG.eval.minCorrectness * 100).toFixed(0)}%)`,
    faithfulness: `${faithfulnessRate.toFixed(1)}% (Target: >= ${(ASSISTANT_CONFIG.eval.minFaithfulness * 100).toFixed(0)}%)`,
    format_check: `${formatRate.toFixed(1)}% (Target: >= ${(ASSISTANT_CONFIG.eval.minFormatPassRate * 100).toFixed(0)}%)`,
    trap_pass_rate: `${trapPassRate.toFixed(1)}% (Target: 100%)`,
    latency: {
      p50: `${p50}ms`,
      p95: `${p95}ms (Max: <= ${ASSISTANT_CONFIG.eval.maxP95LatencyMs}ms)`
    }
  };

  console.log(`\n======================================================`);
  console.log(`📊 EVALUATION BENCHMARK RESULTS TABLE`);
  console.log(`======================================================`);
  console.log(JSON.stringify(summary, null, 2));

  // Determine Gate Pass/Fail
  const meetsRecall = (recallRate / 100) >= ASSISTANT_CONFIG.eval.minRecallAt8;
  const meetsMrr = avgMrr >= ASSISTANT_CONFIG.eval.minMrr;
  const meetsFaithfulness = (faithfulnessRate / 100) >= ASSISTANT_CONFIG.eval.minFaithfulness;
  const meetsCorrectness = (correctnessRate / 100) >= ASSISTANT_CONFIG.eval.minCorrectness;
  const meetsTrap = (trapPassRate / 100) >= ASSISTANT_CONFIG.eval.minTrapPassRate;
  const meetsFormat = (formatRate / 100) >= ASSISTANT_CONFIG.eval.minFormatPassRate;
  const meetsLatency = p95 <= ASSISTANT_CONFIG.eval.maxP95LatencyMs;

  const allPassed = meetsRecall && meetsMrr && meetsFaithfulness && meetsCorrectness && meetsTrap && meetsFormat && meetsLatency;

  return { summary, results, allPassed };
}

if (process.argv[1]?.endsWith('runEval.ts') || process.argv[1]?.endsWith('runEval.js')) {
  runEvaluationHarness().then(({ allPassed }) => {
    if (allPassed) {
      console.log(`\n✅ EVALUATION PASSED: All benchmark thresholds met.`);
      process.exit(0);
    } else {
      console.error(`\n❌ EVALUATION FAILED: One or more benchmark thresholds were not met.`);
      process.exit(1);
    }
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
