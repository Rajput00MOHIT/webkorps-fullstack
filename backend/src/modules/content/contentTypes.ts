export type ContentType =
  | 'BLOG'
  | 'SERVICE_PAGE'
  | 'INDUSTRY_PAGE'
  | 'LOCATION_PAGE'
  | 'COMPARISON'
  | 'CASE_STUDY'
  | 'RESOURCE'
  | 'FAQ'
  | 'LANDING_PAGE';

export type ContentStatus =
  | 'IDEA'
  | 'RESEARCHING'
  | 'BRIEF_READY'
  | 'GENERATING'
  | 'DRAFT_READY'
  | 'VALIDATING'
  | 'NEEDS_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ARCHIVED';

export type SearchIntent =
  | 'INFORMATIONAL'
  | 'COMMERCIAL'
  | 'TRANSACTIONAL'
  | 'NAVIGATIONAL'
  | 'COMPARISON'
  | 'LOCAL';

export type ClaimStatus =
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'UNSUPPORTED'
  | 'CONFLICTING'
  | 'REQUIRES_REVIEW';

export type ReviewDecision =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CHANGES_REQUESTED';

export interface ContentProject {
  id: string;
  organization_id: string;
  website_id?: string;
  opportunity_id?: string;
  title: string;
  topic?: string;
  content_type: ContentType;
  target_keyword: string;
  search_intent?: SearchIntent;
  audience?: string;
  language?: string;
  status: ContentStatus;
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, any>;
}

export interface ContentOutlineSection {
  heading: string;
  level: 'h1' | 'h2' | 'h3';
  purpose: string;
  keyPoints?: string[];
}

export interface ContentBrief {
  id: string;
  organization_id: string;
  content_project_id: string;
  primary_keyword: string;
  secondary_keywords?: string[];
  content_goal?: string;
  target_audience?: string;
  search_intent?: SearchIntent;
  primary_topic?: string;
  secondary_topics?: string[];
  questions_to_answer?: string[];
  recommended_outline?: ContentOutlineSection[];
  competitor_gaps?: Array<{ competitorName: string; gapDescription: string }>;
  differentiation?: string;
  evidence_sources?: Array<{ sourceId?: string; title: string; url?: string; snippet: string; tier?: string }>;
  internal_links?: Array<{ url: string; title: string; anchorSuggestion: string }>;
  external_references?: Array<{ url: string; title: string; domain?: string }>;
  seo_requirements?: {
    minWordCount?: number;
    recommendedWordCount?: number;
    h1Requirement?: string;
    keywordDensity?: string;
  };
  geo_requirements?: {
    entityDefinitionRequired?: boolean;
    faqIncluded?: boolean;
    structuredSummaryRequired?: boolean;
  };
  call_to_action?: string;
  fact_requirements?: string[];
  disclaimer_requirements?: string;
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, any>;
}

export interface ContentDraft {
  id: string;
  organization_id: string;
  content_project_id: string;
  version: number;
  title: string;
  body_markdown: string;
  meta_title?: string;
  meta_description?: string;
  format?: string;
  generation_provider?: string;
  generation_model?: string;
  raw_response?: string;
  token_usage?: Record<string, any>;
  schema_markup?: Record<string, any>;
  status: 'DRAFT' | 'VALIDATING' | 'NEEDS_REVIEW' | 'APPROVED' | 'REJECTED';
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, any>;
}

export interface ClaimFinding {
  claimText: string;
  status: ClaimStatus;
  reason: string;
  evidenceId?: string;
  evidenceUrl?: string;
  actionRequired?: string;
}

export interface ContentValidationResult {
  id: string;
  organization_id: string;
  draft_id: string;
  validation_type: 'FACT_CHECK' | 'SEO_VALIDATION' | 'GEO_VALIDATION' | 'DUPLICATE_CHECK';
  status: 'PASSED' | 'WARNING' | 'FAILED' | 'NEEDS_REVIEW';
  score: number;
  findings: ClaimFinding[] | Array<{ rule: string; passed: boolean; message: string }>;
  recommendations: string[];
  created_at: Date;
}

export interface ContentReview {
  id: string;
  organization_id: string;
  draft_id: string;
  fact_check_score: number;
  seo_score: number;
  originality_score: number;
  decision: ReviewDecision;
  reviewer_user_id?: string;
  reviewer_name?: string;
  comments?: string;
  flags?: any[];
  approved_at?: Date;
  created_at: Date;
  metadata?: Record<string, any>;
}
