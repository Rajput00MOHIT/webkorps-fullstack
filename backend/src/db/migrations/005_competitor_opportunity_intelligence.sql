-- ============================================================================
-- CORP TALK DATABASE MIGRATION 005
-- Competitor + Opportunity Intelligence Foundation (Phase 5)
-- ============================================================================

-- 1. Upgrade competitors table with Phase 5 fields
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS url VARCHAR(500);
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'MANUAL';
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS confidence NUMERIC(4,3) DEFAULT 1.0;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 2. Competitor Sources (Provenance & Discovery Evidence)
CREATE TABLE IF NOT EXISTS competitor_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL,
    reference_id UUID,
    query_or_prompt TEXT,
    evidence_snippet TEXT,
    confidence NUMERIC(4,3) DEFAULT 1.0,
    metadata JSONB DEFAULT '{}',
    observed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Competitor Profiles (Aggregated Analysis Snapshot)
CREATE TABLE IF NOT EXISTS competitor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    services_detected TEXT[] DEFAULT '{}',
    topics_detected TEXT[] DEFAULT '{}',
    pages_crawled INT DEFAULT 0,
    seo_strengths TEXT[] DEFAULT '{}',
    seo_weaknesses TEXT[] DEFAULT '{}',
    ai_mention_count INT DEFAULT 0,
    ai_recommendation_count INT DEFAULT 0,
    ai_citation_count INT DEFAULT 0,
    last_analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Upgrade opportunities table with Phase 5 Unified Opportunity Fields
ALTER TABLE opportunities ALTER COLUMN query DROP NOT NULL;
ALTER TABLE opportunities ALTER COLUMN problem_statement DROP NOT NULL;
ALTER TABLE opportunities ALTER COLUMN recommended_action DROP NOT NULL;
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_status_check;
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_priority_check;

ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS website_id UUID REFERENCES websites(id) ON DELETE SET NULL;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS opportunity_type VARCHAR(50);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS impact INT DEFAULT 50;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS confidence NUMERIC(4,3) DEFAULT 0.8;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS effort VARCHAR(20) DEFAULT 'MEDIUM';
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS score NUMERIC(6,2) DEFAULT 50.0;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES knowledge_entities(id) ON DELETE SET NULL;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS competitor_id UUID REFERENCES competitors(id) ON DELETE SET NULL;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'HYBRID_INTELLIGENCE';
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS deduplication_key VARCHAR(255);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 5. Opportunity Evidence Linking Table
CREATE TABLE IF NOT EXISTS opportunity_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) NOT NULL,
    reference_id UUID,
    title TEXT NOT NULL,
    snippet TEXT,
    url TEXT,
    confidence NUMERIC(4,3) DEFAULT 1.0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Multi-Tenant and Performance Indexes
CREATE INDEX IF NOT EXISTS idx_competitors_org ON competitors(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_competitor_sources_comp ON competitor_sources(organization_id, competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_profiles_comp ON competitor_profiles(organization_id, competitor_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_org ON opportunities(organization_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_opportunities_dedup ON opportunities(organization_id, deduplication_key);
CREATE INDEX IF NOT EXISTS idx_opportunity_evidence_opp ON opportunity_evidence(organization_id, opportunity_id);
