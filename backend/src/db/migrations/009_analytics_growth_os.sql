-- =========================================================
-- PHASE 9: ANALYTICS + GROWTH OPERATING SYSTEM SCHEMA
-- =========================================================

-- 1. ENHANCE ANALYTICS EVENTS
ALTER TABLE analytics_events
    ADD COLUMN IF NOT EXISTS website_id UUID REFERENCES websites(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS entity_id UUID,
    ADD COLUMN IF NOT EXISTS source VARCHAR(50);

-- 2. ENSURE COMPATIBILITY COLUMNS ON PAGES & OPPORTUNITIES
ALTER TABLE pages 
    ADD COLUMN IF NOT EXISTS is_indexable BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS schema_types TEXT[] DEFAULT '{}';

ALTER TABLE opportunities
    ADD COLUMN IF NOT EXISTS impact_score INT DEFAULT 50,
    ADD COLUMN IF NOT EXISTS effort_score INT DEFAULT 50,
    ADD COLUMN IF NOT EXISTS final_priority_score NUMERIC(6,2) DEFAULT 50.0,
    ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'GENERAL',
    ADD COLUMN IF NOT EXISTS source_evidence JSONB DEFAULT '{}';

-- 3. GROWTH ACTIONS TABLE (Prioritized Action Queue)
CREATE TABLE IF NOT EXISTS growth_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL, -- 'SEO', 'GEO', 'CONTENT', 'COMPETITOR', 'LEAD_GENERATION', 'TECHNICAL'
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    rationale TEXT,
    evidence JSONB DEFAULT '{}',
    expected_impact VARCHAR(50) DEFAULT 'HIGH',
    estimated_effort VARCHAR(50) DEFAULT 'MEDIUM',
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'DISMISSED'
    assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. AI USAGE LOGS TABLE (Cost and Usage Tracking)
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    feature VARCHAR(50) NOT NULL, -- 'RESEARCH', 'GEO_PROMPT', 'CONTENT_BRIEF', 'CONTENT_DRAFT', 'ASSISTANT'
    provider VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    estimated_cost_usd NUMERIC(10, 6) DEFAULT 0.000000,
    latency_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. PERFORMANCE & TENANT ISOLATION INDEXES
CREATE INDEX IF NOT EXISTS idx_growth_actions_tenant ON growth_actions(organization_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_growth_actions_opp ON growth_actions(organization_id, opportunity_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant_time ON analytics_events(organization_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_time ON analytics_events(organization_id, event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_tenant_feature ON ai_usage_logs(organization_id, feature, created_at DESC);
