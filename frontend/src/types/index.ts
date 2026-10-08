/**
 * Core Type Definitions for Webkorps Website
 */

export type SectionStatus = 'NOT STARTED' | 'IN PROGRESS' | 'REVIEW' | 'APPROVED' | 'LOCKED';

export type ImageSource = string | any;

export interface SectionDescriptor {
  id: string;
  order: number;
  name: string;
  figmaNodeId?: string;
  status: SectionStatus;
  lockedAt?: string;
  notes?: string;
}

export interface SEOMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
}

export interface OfficeLocation {
  id: string;
  city: string;
  country: string;
  isHQ: boolean;
  addressLines: string[];
  postalCode?: string;
}

export interface LeaderEntity {
  id: string;
  name: string;
  role: string;
  quote?: string;
  image?: string;
  linkedinUrl?: string;
  email?: string;
}

export interface WebkorpsEntity {
  name: string;
  legalName: string;
  url: string;
  foundedYear: number;
  yearsInBusinessDesign: string; // Design shows '08', corporate records mention 10+
  certifications: string[];
  headquarters: OfficeLocation;
  globalOffices: OfficeLocation[];
  leadership: LeaderEntity[];
  coreServices: string[];
  targetIndustries: string[];
  socialProfiles: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    facebook?: string;
  };
}

export interface AnalyticsEvent {
  eventName: string;
  category: 'cta' | 'navigation' | 'form' | 'engagement' | 'scroll';
  label?: string;
  metadata?: Record<string, unknown>;
  timestamp?: number;
}
