import type { AssistantMode, QuestionScope } from './assistantTypes.js';

export type QueryType =
  | 'FACTUAL'
  | 'EXPLANATORY'
  | 'RECOMMENDATION'
  | 'COMPARISON'
  | 'LIST'
  | 'CLARIFICATION'
  | 'UNKNOWN'
  | 'SOURCE_REQUEST'
  | 'RESEARCH'
  | 'LEAD_RESPONSE'
  | 'HYBRID';

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

export type ReviewStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'NEEDS_REVIEW';

export interface AssistantEvaluationQuestion {
  id: string;
  question: string;
  category: string;
  subcategory: string;
  intent: AssistantMode;
  query_type: QueryType;
  knowledge_scope: QuestionScope;
  difficulty: DifficultyLevel;
  industry?: string;
  service?: string;
  technology?: string;
  conversation_id?: string;
  turn_number?: number;
  previous_turns?: string[];
  expected_context?: Record<string, any>;
  expected_entities?: string[];
  expected_answer_type: string;
  expected_source_type: string;
  expected_behavior: string;
  hallucination_risk: boolean;
  requires_research: boolean;
  requires_context: boolean;
  expected_citation?: string;
  expected_unknown_behavior?: boolean;
  ground_truth?: string;
  ground_truth_source?: string;
  source_url?: string;
  created_at: string;
  review_status: ReviewStatus;
}
