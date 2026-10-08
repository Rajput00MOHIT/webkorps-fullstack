/**
 * Phase 9: Analytics + Growth Operating System Types
 */

export type DatePeriod = '7d' | '30d' | '90d' | 'custom';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  periodName: string;
  previousStartDate: Date;
  previousEndDate: Date;
}

export interface MetricTrend {
  current: number;
  previous: number;
  absoluteChange: number;
  percentageChange: number | null; // null if previous is 0
  percentagePointChange?: number; // for rates/percentages
  direction: 'UP' | 'DOWN' | 'FLAT';
  isPositive: boolean; // whether UP is good or bad depends on metric
}

export interface WebsiteAnalytics {
  totalWebsites: number;
  totalPagesDiscovered: number;
  totalPagesCrawled: number;
  indexablePages: number;
  nonIndexablePages: number;
  indexabilityRate: number; // 0 to 100
  totalCrawlRuns: number;
  successfulCrawlRuns: number;
  failedCrawlRuns: number;
  avgWordCount: number;
  schemaTypesDetected: Record<string, number>;
  freshness: {
    lastCrawlCompletedAt: string | null;
    status: 'FRESH' | 'STALE' | 'NO_DATA';
  };
}

export interface SEOAnalytics {
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  resolvedIssues: number;
  resolutionRate: number; // 0 to 100
  issuesByCategory: Record<string, number>;
  trend: MetricTrend;
  topIssues: Array<{
    id: string;
    issueType: string;
    severity: string;
    category: string;
    title: string;
    pageUrl: string | null;
    createdAt: string;
  }>;
}

export interface GEOAnalytics {
  totalPrompts: number;
  totalObservationRuns: number;
  targetBrandMentionRate: {
    ratePercentage: number;
    mentionsCount: number;
    eligibleObservations: number;
    trend: MetricTrend;
  };
  recommendationRate: {
    ratePercentage: number;
    recommendationsCount: number;
    eligibleObservations: number;
    trend: MetricTrend;
  };
  citationRate: {
    overallRatePercentage: number;
    ownedDomainRatePercentage: number;
    thirdPartyRatePercentage: number;
    ownedCitationsCount: number;
    thirdPartyCitationsCount: number;
    eligibleObservations: number;
  };
  promptCoverage: {
    coveredPrompts: number;
    totalPrompts: number;
    coveragePercentage: number;
  };
  engineBreakdown: Array<{
    engineKey: string;
    engineName: string;
    observationsCount: number;
    mentionRate: number;
    recommendationRate: number;
  }>;
  competitorComparison: Array<{
    brandName: string;
    isTargetBrand: boolean;
    mentionsCount: number;
    mentionRatePercentage: number;
    recommendationsCount: number;
    recommendationRatePercentage: number;
  }>;
  sampleStatus: 'SUFFICIENT' | 'EARLY_SIGNAL' | 'INSUFFICIENT_DATA';
}

export interface CompetitorAnalytics {
  totalTrackedCompetitors: number;
  activeCompetitorsCount: number;
  competitorList: Array<{
    id: string;
    domain: string;
    name: string;
    opportunitiesCount: number;
    mentionsCount: number;
    createdAt: string;
  }>;
  gapSummary: {
    serviceGapsCount: number;
    contentGapsCount: number;
    seoGapsCount: number;
  };
}

export interface OpportunityAnalytics {
  totalOpportunities: number;
  openOpportunities: number;
  inProgressOpportunities: number;
  resolvedOpportunities: number;
  dismissedOpportunities: number;
  criticalOpportunities: number;
  highOpportunities: number;
  mediumOpportunities: number;
  lowOpportunities: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  averageImpactScore: number;
  averageEffortScore: number;
  topOpportunities: Array<{
    id: string;
    title: string;
    category: string;
    priority: string;
    finalPriorityScore: number;
    status: string;
    createdAt: string;
  }>;
}

export interface ContentAnalytics {
  totalProjects: number;
  byStatus: Record<string, number>;
  briefsCreated: number;
  draftsCreated: number;
  draftsApproved: number;
  draftsRejected: number;
  approvalRate: number; // 0 to 100
  avgFactVerificationScore: number;
  avgSeoScore: number;
  avgGeoReadinessScore: number;
}

export interface AssistantAnalytics {
  totalConversations: number;
  totalMessages: number;
  userQuestionsCount: number;
  highIntentConversationsCount: number;
  leadIntentRate: number; // percentage of conversations with high intent
  capturedLeadsFromAssistant: number;
  leadCaptureConversionRate: number; // capturedLeads / highIntentConversations
  avgMessagesPerConversation: number;
  leadFunnel: {
    conversations: number;
    highIntentConversations: number;
    leadsCaptured: number;
    leadsQualified: number;
    leadsConverted: number;
  };
}

export interface LeadAnalytics {
  totalLeads: number;
  newLeads: number;
  qualifyingLeads: number;
  qualifiedLeads: number;
  contactedLeads: number;
  engagedLeads: number;
  convertedLeads: number;
  disqualifiedLeads: number;
  lostLeads: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  bySource: Array<{
    source: string;
    totalLeads: number;
    qualifiedLeads: number;
    convertedLeads: number;
    conversionRate: number;
    avgScore: number;
  }>;
  overallConversionRate: {
    convertedCount: number;
    totalEligibleLeads: number;
    ratePercentage: number;
  };
  averageLeadScore: number;
  hotLeadsCount: number;
  warmLeadsCount: number;
  coldLeadsCount: number;
  totalActivitiesLogged: number;
  totalNotesLogged: number;
}

export interface GrowthDiagnosis {
  id: string;
  metric: string;
  category: 'SEO' | 'GEO' | 'LEADS' | 'OPPORTUNITIES' | 'CONTENT' | 'SYSTEM';
  severity: 'CRITICAL' | 'WARNING' | 'OPPORTUNITY' | 'POSITIVE';
  currentValue: string | number;
  previousValue: string | number;
  change: string;
  period: string;
  summary: string;
  evidence: string;
  recommendedActionId?: string;
}

export interface GrowthAction {
  id: string;
  organizationId: string;
  opportunityId: string | null;
  category: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  rationale: string | null;
  evidence: any;
  expectedImpact: string;
  estimatedEffort: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'DISMISSED';
  assignedToUserId: string | null;
  assignedToName?: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AIUsageAnalytics {
  totalRequests: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
  byFeature: Record<string, { requests: number; tokens: number; costUsd: number }>;
  byModel: Record<string, { requests: number; tokens: number; costUsd: number }>;
  status: 'AVAILABLE' | 'NO_DATA';
}

export interface GrowthSnapshot {
  organization: {
    id: string;
    name: string;
    tier: string;
  };
  timeWindow: {
    period: string;
    startDate: string;
    endDate: string;
  };
  kpiSummary: {
    indexablePages: number;
    openSeoIssues: number;
    aiMentionRatePercentage: number;
    openOpportunitiesCount: number;
    highPriorityOpportunitiesCount: number;
    contentProjectsActive: number;
    assistantConversations: number;
    totalLeads: number;
    qualifiedLeads: number;
    leadConversionRatePercentage: number;
  };
  diagnoses: GrowthDiagnosis[];
  topActions: GrowthAction[];
  dataFreshness: {
    generatedAt: string;
    status: string;
  };
}
