export type OpportunityType =
  | 'MISSING_ENTITY'
  | 'MISSING_SERVICE'
  | 'MISSING_SERVICE_PAGE'
  | 'CONTENT_GAP'
  | 'TOPIC_GAP'
  | 'COMPETITOR_GAP'
  | 'COMPETITOR_CITED'
  | 'MISSING_CITATION'
  | 'WEAK_EVIDENCE'
  | 'AUTHORITY_GAP'
  | 'STRUCTURED_DATA_GAP'
  | 'INTERNAL_LINKING_GAP'
  | 'TECHNICAL_SEO_GAP'
  | 'AI_VISIBILITY_GAP'
  | 'AMBIGUOUS_ENTITY'
  | 'MISSING_LOCATION_COVERAGE'
  | 'MISSING_INDUSTRY_COVERAGE';

export type OpportunityPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type OpportunityStatus =
  | 'OPEN'
  | 'IN_REVIEW'
  | 'ACCEPTED'
  | 'DISMISSED'
  | 'RESOLVED';

export type OpportunityEffort = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Opportunity {
  id: string;
  organization_id: string;
  website_id?: string;
  opportunity_type: OpportunityType;
  title: string;
  description: string;
  query?: string;
  problem_statement?: string;
  recommended_action?: string;
  status: OpportunityStatus;
  priority: OpportunityPriority;
  impact: number;
  confidence: number;
  effort: OpportunityEffort;
  score: number;
  entity_id?: string;
  competitor_id?: string;
  source: string;
  evidence?: any;
  competitors_cited?: string[];
  missing_proof_points?: string[];
  deduplication_key?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface OpportunityEvidence {
  id: string;
  organization_id: string;
  opportunity_id: string;
  evidence_type: 'AI_OBSERVATION' | 'CRAWL_ISSUE' | 'RESEARCH_SOURCE' | 'KNOWLEDGE_GAP' | 'COMPETITOR_SIGNAL';
  reference_id?: string;
  title: string;
  snippet?: string;
  url?: string;
  confidence: number;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface OpportunitySummary {
  totalOpportunities: number;
  byPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byType: Record<string, number>;
  byStatus: {
    open: number;
    in_review: number;
    accepted: number;
    resolved: number;
    dismissed: number;
  };
  topOpportunities: Opportunity[];
}
