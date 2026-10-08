-- ============================================================================
-- CORP TALK DATABASE MIGRATION 007
-- AI Website Assistant (Phase 7)
-- ============================================================================

-- 1. Upgrade conversations table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS website_id UUID REFERENCES websites(id) ON DELETE SET NULL;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'WEB_WIDGET';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS visitor_metadata JSONB DEFAULT '{}';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS state JSONB DEFAULT '{}';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 2. Upgrade messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS role VARCHAR(20);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS token_usage JSONB DEFAULT '{}';

-- 3. Assistant Usage & Telemetry (Cost Control)
CREATE TABLE IF NOT EXISTS assistant_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    provider VARCHAR(50),
    model VARCHAR(50),
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    total_tokens INT DEFAULT 0,
    estimated_cost NUMERIC(10, 6) DEFAULT 0,
    latency_ms INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Multi-Tenant and Performance Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_org ON conversations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(organization_id, conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_assistant_usage_org ON assistant_usage(organization_id, created_at DESC);
