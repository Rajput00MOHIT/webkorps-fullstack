import { ASSISTANT_CONFIG } from '../config/assistantConfig.js';

export interface RetrievedChunkTrace {
  id: string;
  entity_id?: string;
  sourceType: string;
  title: string;
  score: number;
  sourceTier: number;
}

export interface RequestTrace {
  request_id: string;
  org_id: string;
  conversation_id: string;
  timestamp: string;
  raw_query: string;
  rewritten_query: string;
  rewriter_json: any;
  tool_calls: Array<{ name: string; args: any; result_count: number; latency_ms: number }>;
  retrieved_chunks: RetrievedChunkTrace[];
  evidence_pack: string[];
  answer_path: 'llm' | 'shortcut' | 'fallback';
  raw_answer: string;
  validator_result: {
    passed: boolean;
    violations: string[];
  };
  verification_result: {
    is_grounded: boolean;
    policy_passed: boolean;
    unsupported_claims_count: number;
  };
  stage_latencies_ms: {
    rewrite: number;
    retrieval: number;
    generation: number;
    verification: number;
    total: number;
  };
  token_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class AssistantTraceLogger {
  private static traces: RequestTrace[] = [];

  public static logTrace(trace: RequestTrace): void {
    if (!ASSISTANT_CONFIG.observability.enableTraceLogging) return;

    this.traces.unshift(trace);
    if (this.traces.length > ASSISTANT_CONFIG.observability.maxTraceHistory) {
      this.traces.pop();
    }

    // Also output structured debug in development
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_CORP_TALK) {
      console.log(`[Trace:${trace.request_id}] Q="${trace.raw_query}" -> Rewritten="${trace.rewritten_query}" | Path=${trace.answer_path} | Latency=${trace.stage_latencies_ms.total}ms`);
    }
  }

  public static getRecentTraces(limit: number = 20): RequestTrace[] {
    return this.traces.slice(0, limit);
  }

  public static getTraceById(requestId: string): RequestTrace | undefined {
    return this.traces.find(t => t.request_id === requestId);
  }

  public static clear(): void {
    this.traces = [];
  }
}
