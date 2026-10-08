export type CompetitorStatus = 'ACTIVE' | 'INACTIVE' | 'UNVERIFIED' | 'ARCHIVED';

export type CompetitorSourceType =
  | 'MANUAL'
  | 'KNOWLEDGE_GRAPH'
  | 'WEB_RESEARCH'
  | 'AI_OBSERVATION'
  | 'SEARCH_RESULT'
  | 'SYSTEM_DISCOVERY';

export interface Competitor {
  id: string;
  organization_id: string;
  name: string;
  domain: string;
  url?: string;
  description?: string;
  core_capabilities?: string[];
  source: CompetitorSourceType;
  status: CompetitorStatus;
  confidence: number;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface CompetitorSource {
  id: string;
  organization_id: string;
  competitor_id: string;
  source_type: CompetitorSourceType;
  reference_id?: string;
  query_or_prompt?: string;
  evidence_snippet?: string;
  confidence: number;
  metadata?: Record<string, any>;
  observed_at: Date;
  created_at: Date;
}

export interface CompetitorProfile {
  id: string;
  organization_id: string;
  competitor_id: string;
  competitor_name: string;
  domain: string;
  url?: string;
  services_detected: string[];
  topics_detected: string[];
  pages_crawled: number;
  seo_strengths: string[];
  seo_weaknesses: string[];
  ai_mention_count: number;
  ai_recommendation_count: number;
  ai_citation_count: number;
  last_analyzed_at: Date;
  metadata?: Record<string, any>;
}

export interface CompetitorVisibilityComparison {
  competitorId: string;
  competitorName: string;
  competitorDomain: string;
  organizationMentions: number;
  organizationRecommendations: number;
  organizationCitations: number;
  competitorMentions: number;
  competitorRecommendations: number;
  competitorCitations: number;
  prompts: Array<{
    promptId: string;
    promptText: string;
    targetMentioned: boolean;
    targetRecommended: boolean;
    targetCited: boolean;
    competitorMentioned: boolean;
    competitorRecommended: boolean;
    observedPosition?: number;
  }>;
}

export interface CompetitorFullComparison {
  competitorId: string;
  competitorName: string;
  competitorDomain: string;
  serviceComparison: {
    organizationServices: string[];
    competitorServices: string[];
    sharedServices: string[];
    competitorAdvantageServices: string[];
  };
  seoComparison: {
    organizationPages: number;
    competitorPages: number;
    organizationSeoIssues: number;
    competitorSeoIssues: number;
  };
  aiVisibilityComparison: {
    organizationMentionRate: number;
    competitorMentionRate: number;
    organizationRecommendationRate: number;
    competitorRecommendationRate: number;
    organizationCitationRate: number;
    competitorCitationRate: number;
  };
  gapsIdentified: string[];
}

export interface DiscoveredCompetitorCandidate {
  name: string;
  domain: string;
  source: CompetitorSourceType;
  confidence: number;
  frequency: number;
  evidenceSnippet: string;
  observedQueries: string[];
}
