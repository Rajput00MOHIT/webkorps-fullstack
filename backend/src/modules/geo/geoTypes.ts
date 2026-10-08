export type PromptCategory =
  | "BRAND"
  | "SERVICE"
  | "INDUSTRY"
  | "LOCAL"
  | "COMPETITOR"
  | "RECOMMENDATION"
  | "COMPARISON"
  | "GENERAL";

export type ObservationStatus =
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED"
  | "PROVIDER_UNAVAILABLE";

export type OpportunityType =
  | "MISSING_ENTITY"
  | "MISSING_SERVICE_PAGE"
  | "WEAK_EVIDENCE"
  | "COMPETITOR_CITED"
  | "MISSING_CITATION"
  | "MISSING_STRUCTURED_DATA"
  | "CONTENT_GAP"
  | "AUTHORITY_GAP"
  | "AMBIGUOUS_ENTITY";

export type OpportunityPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface AIEngine {
  id: string;
  provider: string;
  name: string;
  model?: string;
  version?: string;
  type?: string;
  active: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface VisibilityPrompt {
  id: string;
  organizationId: string;
  promptText: string;
  category: PromptCategory;
  language: string;
  region: string;
  targetEntity: string;
  active: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIObservationRun {
  id: string;
  organizationId: string;
  promptId?: string;
  aiEngineId?: string;
  status: ObservationStatus;
  startedAt: Date;
  completedAt?: Date;
  rawResponse?: string;
  provider?: string;
  model?: string;
  promptText?: string;
  targetEntity?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface AIMention {
  id: string;
  observationRunId: string;
  organizationId: string;
  entityName: string;
  entityType: string;
  mentioned: boolean;
  position?: number;
  mentionContext?: string;
  recommendationSignal: boolean;
  confidence: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface AICitation {
  id: string;
  observationRunId: string;
  organizationId: string;
  citedUrl: string;
  citedDomain: string;
  citedTitle?: string;
  citationContext?: string;
  citationPosition?: number;
  isTargetDomain: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface AICompetitorMention {
  id: string;
  observationRunId: string;
  organizationId: string;
  competitorName: string;
  mentioned: boolean;
  position?: number;
  recommendationSignal: boolean;
  context?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface GEOOpportunity {
  id: string;
  organizationId: string;
  opportunityType: OpportunityType;
  title: string;
  description: string;
  evidence?: string;
  relatedQuery?: string;
  relatedUrl?: string;
  competitor?: string;
  priority: OpportunityPriority;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "DISMISSED";
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface GEOSummaryMetrics {
  observations: number;
  mentionRate: number;
  recommendationRate: number;
  citationRate: number;
  ownedCitationRate: number;
  competitorMentionRate: number;
  promptCoverage: number;
  trend: {
    previousPeriodMentionRate: number;
    currentPeriodMentionRate: number;
  };
}
