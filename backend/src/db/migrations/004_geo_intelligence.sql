-- ====================================================================
-- Corp Talk Migration 004: GEO / AI Visibility Intelligence & Universal Crawl
-- Forward-only, repeatable, tenant-aware
-- ====================================================================

-- 1. Universal Crawl extensions to crawl_runs
ALTER TABLE crawl_runs ADD COLUMN IF NOT EXISTS target_url TEXT;
ALTER TABLE crawl_runs ADD COLUMN IF NOT EXISTS scope VARCHAR(50) DEFAULT 'DOMAIN';
ALTER TABLE crawl_runs ADD COLUMN IF NOT EXISTS render_javascript BOOLEAN DEFAULT FALSE;

-- 2. Enhance existing ai_engines table with provider, model & operational fields
ALTER TABLE ai_engines ADD COLUMN IF NOT EXISTS provider VARCHAR(100) DEFAULT 'custom';
ALTER TABLE ai_engines ADD COLUMN IF NOT EXISTS model VARCHAR(100);
ALTER TABLE ai_engines ADD COLUMN IF NOT EXISTS version VARCHAR(50);
ALTER TABLE ai_engines ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'CHAT';
ALTER TABLE ai_engines ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE ai_engines ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE ai_engines ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update seeded AI engines with providers & models
UPDATE ai_engines SET provider = 'openai', model = 'gpt-4o', active = TRUE WHERE engine_key = 'OPENAI_SEARCH';
UPDATE ai_engines SET provider = 'google', model = 'gemini-1.5-pro', active = TRUE WHERE engine_key = 'GEMINI';
UPDATE ai_engines SET provider = 'perplexity', model = 'sonar', active = TRUE WHERE engine_key = 'PERPLEXITY';
UPDATE ai_engines SET provider = 'anthropic', model = 'claude-3-5-sonnet', active = TRUE WHERE engine_key = 'CLAUDE';

-- 3. Visibility Prompts Table (Tracked queries across categories)
CREATE TABLE IF NOT EXISTS visibility_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL' CHECK (category IN ('BRAND', 'SERVICE', 'INDUSTRY', 'LOCAL', 'COMPETITOR', 'RECOMMENDATION', 'COMPARISON', 'GENERAL')),
    language VARCHAR(10) DEFAULT 'en',
    region VARCHAR(10) DEFAULT 'IN',
    target_entity VARCHAR(255) NOT NULL DEFAULT 'Webkorps',
    active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Enhance ai_observation_runs table
ALTER TABLE ai_observation_runs ALTER COLUMN prompt_id DROP NOT NULL;
ALTER TABLE ai_observation_runs ALTER COLUMN ai_engine_id DROP NOT NULL;
ALTER TABLE ai_observation_runs DROP CONSTRAINT IF EXISTS ai_observation_runs_prompt_id_fkey;
ALTER TABLE ai_observation_runs ADD CONSTRAINT ai_observation_runs_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES visibility_prompts(id) ON DELETE SET NULL;
ALTER TABLE ai_observation_runs ALTER COLUMN raw_prompt DROP NOT NULL;
ALTER TABLE ai_observation_runs ALTER COLUMN raw_response_text DROP NOT NULL;
ALTER TABLE ai_observation_runs ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'QUEUED';
ALTER TABLE ai_observation_runs ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE ai_observation_runs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE ai_observation_runs ADD COLUMN IF NOT EXISTS raw_response TEXT;
ALTER TABLE ai_observation_runs ADD COLUMN IF NOT EXISTS provider VARCHAR(100);
ALTER TABLE ai_observation_runs ADD COLUMN IF NOT EXISTS model VARCHAR(100);
ALTER TABLE ai_observation_runs ADD COLUMN IF NOT EXISTS prompt_text TEXT;
ALTER TABLE ai_observation_runs ADD COLUMN IF NOT EXISTS target_entity VARCHAR(255);
ALTER TABLE ai_observation_runs ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE ai_observation_runs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE ai_observation_runs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 5. Enhance ai_mentions table
ALTER TABLE ai_mentions ALTER COLUMN brand_name DROP NOT NULL;
ALTER TABLE ai_mentions ALTER COLUMN observation_id DROP NOT NULL;
ALTER TABLE ai_mentions DROP CONSTRAINT IF EXISTS ai_mentions_observation_id_fkey;
ALTER TABLE ai_mentions ADD COLUMN IF NOT EXISTS observation_run_id UUID;
ALTER TABLE ai_mentions ADD COLUMN IF NOT EXISTS entity_name VARCHAR(255);
ALTER TABLE ai_mentions ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50) DEFAULT 'COMPANY';
ALTER TABLE ai_mentions ADD COLUMN IF NOT EXISTS mentioned BOOLEAN DEFAULT FALSE;
ALTER TABLE ai_mentions ADD COLUMN IF NOT EXISTS position INTEGER;
ALTER TABLE ai_mentions ADD COLUMN IF NOT EXISTS mention_context TEXT;
ALTER TABLE ai_mentions ADD COLUMN IF NOT EXISTS recommendation_signal BOOLEAN DEFAULT FALSE;
ALTER TABLE ai_mentions ADD COLUMN IF NOT EXISTS confidence REAL DEFAULT 0.0;
ALTER TABLE ai_mentions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE ai_mentions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 6. Enhance ai_citations table
ALTER TABLE ai_citations ALTER COLUMN observation_id DROP NOT NULL;
ALTER TABLE ai_citations DROP CONSTRAINT IF EXISTS ai_citations_observation_id_fkey;
ALTER TABLE ai_citations ADD COLUMN IF NOT EXISTS observation_run_id UUID;
ALTER TABLE ai_citations ADD COLUMN IF NOT EXISTS cited_title TEXT;
ALTER TABLE ai_citations ADD COLUMN IF NOT EXISTS citation_context TEXT;
ALTER TABLE ai_citations ADD COLUMN IF NOT EXISTS citation_position INTEGER;
ALTER TABLE ai_citations ADD COLUMN IF NOT EXISTS is_target_domain BOOLEAN DEFAULT FALSE;
ALTER TABLE ai_citations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE ai_citations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 7. AI Competitor Mentions Table
CREATE TABLE IF NOT EXISTS ai_competitor_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    observation_run_id UUID NOT NULL REFERENCES ai_observation_runs(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    competitor_name VARCHAR(255) NOT NULL,
    mentioned BOOLEAN NOT NULL DEFAULT TRUE,
    position INTEGER,
    recommendation_signal BOOLEAN DEFAULT FALSE,
    context TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. GEO Opportunities Table
CREATE TABLE IF NOT EXISTS geo_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    opportunity_type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence TEXT,
    related_query TEXT,
    related_url TEXT,
    competitor VARCHAR(255),
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    status VARCHAR(50) DEFAULT 'OPEN',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Indexes for Multi-Tenant Isolation and Fast Analytics
CREATE INDEX IF NOT EXISTS idx_visibility_prompts_org ON visibility_prompts(organization_id, active);
CREATE INDEX IF NOT EXISTS idx_ai_observation_runs_org ON ai_observation_runs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_mentions_org ON ai_mentions(organization_id, mentioned);
CREATE INDEX IF NOT EXISTS idx_ai_citations_org ON ai_citations(organization_id, is_target_domain);
CREATE INDEX IF NOT EXISTS idx_ai_competitor_mentions_org ON ai_competitor_mentions(organization_id);
CREATE INDEX IF NOT EXISTS idx_geo_opportunities_org ON geo_opportunities(organization_id, status);
