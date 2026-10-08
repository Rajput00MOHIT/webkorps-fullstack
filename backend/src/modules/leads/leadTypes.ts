export type LeadSource =
  | 'AI_ASSISTANT'
  | 'WEBSITE_FORM'
  | 'CONTACT_FORM'
  | 'MANUAL'
  | 'IMPORT'
  | 'REFERRAL'
  | 'OTHER';

export type LeadStatus =
  | 'NEW'
  | 'QUALIFYING'
  | 'QUALIFIED'
  | 'CONTACTED'
  | 'ENGAGED'
  | 'CONVERTED'
  | 'DISQUALIFIED'
  | 'LOST'
  | 'ARCHIVED';

export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ActivityType =
  | 'NOTE'
  | 'CALL'
  | 'EMAIL'
  | 'MEETING'
  | 'TASK'
  | 'STATUS_CHANGE'
  | 'ASSIGNMENT'
  | 'FOLLOW_UP';

export interface LeadQualification {
  intentLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  fitLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  urgencyLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  completenessLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  engagementLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  matchedServiceName?: string;
  matchedServiceId?: string;
}

export interface LeadScoreBreakdown {
  score: number;
  priority: LeadPriority;
  scoreCategory: 'HOT' | 'WARM' | 'COLD';
  reasons: string[];
  dimensions: {
    intentScore: number;
    fitScore: number;
    urgencyScore: number;
    completenessScore: number;
    engagementScore: number;
  };
}

export interface Lead {
  id: string;
  organization_id: string;
  website_id?: string;
  conversation_id?: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone: string;
  company?: string;
  job_title?: string;
  country?: string;
  message: string;
  source: LeadSource;
  status: LeadStatus;
  score: number;
  score_category: 'HOT' | 'WARM' | 'COLD';
  score_reasons: string[];
  priority: LeadPriority;
  assigned_to_user_id?: string;
  assigned_to_name?: string;
  matched_service_id?: string;
  qualification: LeadQualification;
  consent_metadata: Record<string, any>;
  notes?: string;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface LeadActivity {
  id: string;
  organization_id: string;
  lead_id: string;
  type: ActivityType;
  title: string;
  description?: string;
  created_by?: string;
  creator_name?: string;
  scheduled_at?: Date;
  completed_at?: Date;
  metadata: Record<string, any>;
  created_at: Date;
}

export interface LeadNote {
  id: string;
  organization_id: string;
  lead_id: string;
  user_id?: string;
  author_name?: string;
  content: string;
  created_at: Date;
}

export interface LeadTimelineEvent {
  id: string;
  eventType: 'LEAD_CREATED' | 'ACTIVITY' | 'NOTE' | 'STATUS_CHANGE' | 'ASSIGNMENT';
  title: string;
  description?: string;
  timestamp: Date;
  actor?: string;
  metadata?: Record<string, any>;
}
