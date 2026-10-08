export type AssistantMode =
  | 'COMPANY_QA'
  | 'SERVICE_QA'
  | 'WEBSITE_QA'
  | 'TECHNOLOGY_QA'
  | 'INDUSTRY_QA'
  | 'CASE_STUDY_QA'
  | 'PROJECT_REQUIREMENT'
  | 'FEATURE_QA'
  | 'GENERAL_GUIDANCE'
  | 'LEAD_INTENT'
  | 'FOLLOW_UP'
  | 'CLARIFICATION'
  | 'DYNAMIC_RESEARCH';

export type QuestionScope = 'COMPANY_SPECIFIC' | 'GENERAL' | 'HYBRID';

export type LeadIntentLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';

export type RetrievalSourceType =
  | 'KNOWLEDGE_ENTITY'
  | 'WEBSITE_PAGE'
  | 'APPROVED_CONTENT'
  | 'RESEARCH_EVIDENCE';

export type TrustLevel =
  | 'AUTHORITATIVE_KG'
  | 'APPROVED_CONTENT'
  | 'ORGANIZATION_WEBSITE'
  | 'VERIFIED_RESEARCH'
  | 'GENERAL_EXTERNAL';

export interface RetrievalItem {
  source_type: RetrievalSourceType;
  source_id?: string;
  title: string;
  url?: string;
  content: string;
  trust_level: TrustLevel;
  relevance: number; // 0.0 - 1.0
  verification_status?: string;
  metadata?: Record<string, any>;
}

export interface LeadIntentSignal {
  level: LeadIntentLevel;
  reason: string;
  detectedService?: string;
  detectedIndustry?: string;
  budgetOrTimeline?: string;
}

export interface SuggestedAction {
  label: string;
  href: string;
  variant: 'primary' | 'secondary';
}

export interface ConversationContext {
  activeTopic?: string;
  detectedIndustry?: string;
  projectType?: string;
  requestedService?: string;
  technology?: string;
  featureInterest?: string;
  questionScope?: QuestionScope;
  entities: Record<string, string>;
  unresolvedQuestions?: string[];
  isDissatisfied?: boolean;
}

export interface IntentDetectionResult {
  mode: AssistantMode;
  questionScope: QuestionScope;
  leadIntent: LeadIntentSignal;
  effectiveQuery: string;
  context: ConversationContext;
  detectedService?: string;
  detectedIndustry?: string;
  detectedTechnology?: string;
  isDissatisfied: boolean;
}

export interface AssistantQueryResponse {
  conversationId: string;
  messageId: string;
  answer: string;
  sources: Array<{
    source_type: string;
    source_id?: string;
    title: string;
    url?: string;
    trust_level?: string;
    verification_status?: string;
  }>;
  intent: AssistantMode;
  questionScope?: QuestionScope;
  confidence: ConfidenceLevel;
  suggestedFollowups: string[];
  suggestedActions: SuggestedAction[];
  leadIntentSignal: LeadIntentSignal;
  metadata: {
    provider: string;
    model: string;
    tokens?: Record<string, any>;
    latencyMs?: number;
    context?: ConversationContext;
    resolvedQuery?: string;
    sourceTypes?: string[];
    queryExpansions?: string[];
    externalEvidenceCount?: number;
  };
}

export interface Conversation {
  id: string;
  organization_id: string;
  website_id?: string;
  session_id: string;
  status: 'ACTIVE' | 'CLOSED' | 'EXPIRED';
  channel: string;
  visitor_metadata: Record<string, any>;
  state: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  organization_id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  sender: 'user' | 'ai' | 'system';
  text: string;
  suggested_actions: SuggestedAction[];
  retrieved_evidence: any;
  metadata: Record<string, any>;
  token_usage?: Record<string, any>;
  created_at: Date;
}

export interface EvaluationTestCase {
  id: string;
  category:
    | 'COMPANY'
    | 'SERVICES'
    | 'TECHNOLOGIES'
    | 'INDUSTRIES'
    | 'CASE_STUDIES'
    | 'CONTEXT'
    | 'GENERAL'
    | 'HYBRID'
    | 'UNKNOWN_HALLUCINATION_TEST';
  question: string;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
  expectedIntent: AssistantMode | AssistantMode[];
  expectedQuestionScope?: QuestionScope;
  expectedEntities?: Record<string, string>;
  expectedKeywords?: string[];
  mustNotContain?: string[];
  expectVerifiedCaseStudy?: boolean;
  description: string;
}

export interface EvaluationCaseResult {
  testId: string;
  category: string;
  question: string;
  passed: boolean;
  actualIntent: AssistantMode;
  actualScope?: QuestionScope;
  actualAnswer: string;
  intentMatch: boolean;
  entityMatch: boolean;
  hallucinationClean: boolean;
  unknownHandledCorrectly: boolean;
  sourcesRetrievedCount: number;
  notes?: string;
}

export interface EvaluationRunSummary {
  id: string;
  total: number;
  passed: number;
  failed: number;
  passRatePercentage: number;
  intentAccuracyRate: number;
  entityExtractionRate: number;
  contextRetentionRate: number;
  hallucinationRate: number;
  unknownHandlingRate: number;
  results: EvaluationCaseResult[];
  createdAt: string;
}
