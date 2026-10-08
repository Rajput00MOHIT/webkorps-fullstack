-- ============================================================================
-- CORP TALK DATABASE MIGRATION 008
-- Lead Intelligence + CRM (Phase 8)
-- ============================================================================

-- 1. Upgrade leads table
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_score_category_check;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS website_id UUID REFERENCES websites(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS job_title VARCHAR(150);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INT DEFAULT 50;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'MEDIUM';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS qualification JSONB DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS consent_metadata JSONB DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS matched_service_id UUID REFERENCES knowledge_entities(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 2. CRM Activities Table
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. CRM Lead Notes Table
CREATE TABLE IF NOT EXISTS lead_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Multi-Tenant and Performance Indexes
CREATE INDEX IF NOT EXISTS idx_leads_org_status ON leads(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_org_priority ON leads(organization_id, priority);
CREATE INDEX IF NOT EXISTS idx_leads_org_email ON leads(organization_id, email);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(organization_id, lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead ON lead_notes(organization_id, lead_id, created_at DESC);
