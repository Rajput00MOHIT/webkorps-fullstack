-- ====================================================================
-- Corp Talk Migration 003: Search & Research Intelligence Foundation
-- Forward-only, repeatable, tenant-aware
-- ====================================================================

-- 1. Research Sessions Table
CREATE TABLE IF NOT EXISTS research_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    route VARCHAR(50) DEFAULT 'WEB_RESEARCH' CHECK (route IN ('INTERNAL_KNOWLEDGE', 'CRAWL_DATABASE', 'WEB_RESEARCH', 'HYBRID_RESEARCH')),
    status VARCHAR(50) DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Research Sources Table
CREATE TABLE IF NOT EXISTS research_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    research_session_id UUID NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL DEFAULT 'searxng',
    url TEXT NOT NULL,
    canonical_url TEXT,
    title TEXT,
    domain VARCHAR(255) NOT NULL,
    snippet TEXT,
    search_rank INT DEFAULT 1,
    source_quality_tier VARCHAR(50) DEFAULT 'TIER_3' CHECK (source_quality_tier IN ('TIER_1', 'TIER_2', 'TIER_3', 'TIER_4')),
    relevance_score FLOAT DEFAULT 0.0,
    http_status INT DEFAULT 200,
    content_type VARCHAR(100) DEFAULT 'text/html',
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    content_hash VARCHAR(64),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Research Evidence Table
CREATE TABLE IF NOT EXISTS research_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    research_session_id UUID NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
    research_source_id UUID NOT NULL REFERENCES research_sources(id) ON DELETE CASCADE,
    evidence_text TEXT NOT NULL,
    evidence_type VARCHAR(50) DEFAULT 'PASSAGE',
    relevance_score FLOAT DEFAULT 0.0,
    source_locator TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Indexes for Performance & Tenant Isolation
CREATE INDEX IF NOT EXISTS idx_research_sessions_tenant ON research_sessions(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_sources_session ON research_sources(research_session_id, search_rank);
CREATE INDEX IF NOT EXISTS idx_research_evidence_session ON research_evidence(research_session_id, relevance_score DESC);
