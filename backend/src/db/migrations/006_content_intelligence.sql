-- ============================================================================
-- CORP TALK DATABASE MIGRATION 006
-- AI Content Intelligence / Content Engine (Phase 6)
-- ============================================================================

-- 1. Upgrade content_projects table
ALTER TABLE content_projects DROP CONSTRAINT IF EXISTS content_projects_status_check;

ALTER TABLE content_projects ADD COLUMN IF NOT EXISTS website_id UUID REFERENCES websites(id) ON DELETE SET NULL;
ALTER TABLE content_projects ADD COLUMN IF NOT EXISTS topic VARCHAR(255);
ALTER TABLE content_projects ADD COLUMN IF NOT EXISTS content_type VARCHAR(50) DEFAULT 'BLOG';
ALTER TABLE content_projects ADD COLUMN IF NOT EXISTS audience VARCHAR(100) DEFAULT 'B2B Decision Makers';
ALTER TABLE content_projects ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';
ALTER TABLE content_projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE content_projects ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 2. Upgrade content_briefs table
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS content_goal TEXT;
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS target_audience VARCHAR(100);
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS search_intent VARCHAR(100);
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS primary_topic VARCHAR(255);
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS secondary_topics TEXT[] DEFAULT '{}';
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS competitor_gaps JSONB DEFAULT '[]';
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS differentiation TEXT;
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS evidence_sources JSONB DEFAULT '[]';
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS internal_links JSONB DEFAULT '[]';
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS external_references JSONB DEFAULT '[]';
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS seo_requirements JSONB DEFAULT '{}';
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS geo_requirements JSONB DEFAULT '{}';
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS call_to_action TEXT;
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS fact_requirements TEXT[] DEFAULT '{}';
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS disclaimer_requirements TEXT;
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 3. Upgrade content_drafts table
ALTER TABLE content_drafts DROP CONSTRAINT IF EXISTS content_drafts_status_check;

ALTER TABLE content_drafts ADD COLUMN IF NOT EXISTS format VARCHAR(50) DEFAULT 'MARKDOWN';
ALTER TABLE content_drafts ADD COLUMN IF NOT EXISTS generation_provider VARCHAR(50);
ALTER TABLE content_drafts ADD COLUMN IF NOT EXISTS generation_model VARCHAR(50);
ALTER TABLE content_drafts ADD COLUMN IF NOT EXISTS raw_response TEXT;
ALTER TABLE content_drafts ADD COLUMN IF NOT EXISTS token_usage JSONB DEFAULT '{}';
ALTER TABLE content_drafts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE content_drafts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 4. Content Validations Table (Fact Check, SEO, GEO, Duplication)
CREATE TABLE IF NOT EXISTS content_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    draft_id UUID NOT NULL REFERENCES content_drafts(id) ON DELETE CASCADE,
    validation_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    score INT DEFAULT 100,
    findings JSONB DEFAULT '[]',
    recommendations TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Upgrade content_reviews table
ALTER TABLE content_reviews ADD COLUMN IF NOT EXISTS decision VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE content_reviews ADD COLUMN IF NOT EXISTS reviewer_name VARCHAR(255);
ALTER TABLE content_reviews ADD COLUMN IF NOT EXISTS comments TEXT;
ALTER TABLE content_reviews ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE content_reviews ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 6. Multi-Tenant and Performance Indexes
CREATE INDEX IF NOT EXISTS idx_content_projects_org ON content_projects(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_content_briefs_proj ON content_briefs(organization_id, content_project_id);
CREATE INDEX IF NOT EXISTS idx_content_drafts_proj ON content_drafts(organization_id, content_project_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_content_validations_draft ON content_validations(organization_id, draft_id);
CREATE INDEX IF NOT EXISTS idx_content_reviews_draft ON content_reviews(organization_id, draft_id);
