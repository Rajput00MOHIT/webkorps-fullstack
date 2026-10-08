export interface AssistantConfig {
  models: {
    primaryGenerator: string;
    queryRewriter: string;
    verifier: string;
    embeddingModel: string;
    rerankerModel: string;
  };
  retrieval: {
    vectorTopK: number;
    keywordTopK: number;
    rrfK: number; // Standard RRF denominator constant (default: 60)
    rerankTopK: number;
    minRelevanceScore: number;
    maxAgentSteps: number;
    timeoutMs: number;
  };
  generation: {
    temperature: number;
    maxTokens: number;
  };
  observability: {
    enableTraceLogging: boolean;
    maxTraceHistory: number;
  };
  eval: {
    minRecallAt8: number;
    minMrr: number;
    minFaithfulness: number;
    minCorrectness: number;
    minTrapPassRate: number;
    minFormatPassRate: number;
    maxP95LatencyMs: number;
  };
}

export const ASSISTANT_CONFIG: AssistantConfig = {
  models: {
    primaryGenerator: process.env.ASSISTANT_MODEL || 'claude-3-5-sonnet-20241022',
    queryRewriter: process.env.REWRITER_MODEL || 'claude-3-5-haiku-20241022',
    verifier: process.env.VERIFIER_MODEL || 'claude-3-5-haiku-20241022',
    embeddingModel: process.env.LOCAL_EMBEDDING_MODEL || 'bge-m3',
    rerankerModel: process.env.RERANKER_MODEL || 'bge-reranker-v2-m3'
  },
  retrieval: {
    vectorTopK: 40,
    keywordTopK: 40,
    rrfK: 60,
    rerankTopK: 8,
    minRelevanceScore: 0.25,
    maxAgentSteps: 4,
    timeoutMs: 12000
  },
  generation: {
    temperature: 0.2,
    maxTokens: 1500
  },
  observability: {
    enableTraceLogging: true,
    maxTraceHistory: 500
  },
  eval: {
    minRecallAt8: parseFloat(process.env.EVAL_MIN_RECALL || '0.90'),
    minMrr: parseFloat(process.env.EVAL_MIN_MRR || '0.70'),
    minFaithfulness: parseFloat(process.env.EVAL_MIN_FAITHFULNESS || '0.95'),
    minCorrectness: parseFloat(process.env.EVAL_MIN_CORRECTNESS || '0.85'),
    minTrapPassRate: parseFloat(process.env.EVAL_MIN_TRAP_PASS || '1.00'),
    minFormatPassRate: parseFloat(process.env.EVAL_MIN_FORMAT_PASS || '0.98'),
    maxP95LatencyMs: parseInt(process.env.EVAL_MAX_P95_LATENCY || '8000', 10)
  }
};
