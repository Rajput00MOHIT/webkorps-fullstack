-- ====================================================================
-- Corp Talk Migration 002: Web Crawler & Website Intelligence Layer
-- Forward-only, repeatable, tenant-aware
-- ====================================================================

-- 1. Enhance crawl_runs with progress & operational telemetry
ALTER TABLE crawl_runs ADD COLUMN IF NOT EXISTS pages_failed INT DEFAULT 0;
ALTER TABLE crawl_runs ADD COLUMN IF NOT EXISTS max_pages INT DEFAULT 100;
ALTER TABLE crawl_runs ADD COLUMN IF NOT EXISTS robots_status VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE crawl_runs ADD COLUMN IF NOT EXISTS sitemap_status VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE crawl_runs ADD COLUMN IF NOT EXISTS duration_ms BIGINT DEFAULT 0;
ALTER TABLE crawl_runs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 2. Enhance pages with indexability and link graph aggregates
ALTER TABLE pages ADD COLUMN IF NOT EXISTS indexability VARCHAR(50) DEFAULT 'UNKNOWN';
ALTER TABLE pages ADD COLUMN IF NOT EXISTS indexability_reason TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS response_time_ms INT DEFAULT 0;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS content_type VARCHAR(100) DEFAULT 'text/html';
ALTER TABLE pages ADD COLUMN IF NOT EXISTS redirect_url TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS inbound_internal_links_count INT DEFAULT 0;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS outbound_internal_links_count INT DEFAULT 0;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS outbound_external_links_count INT DEFAULT 0;

-- 3. Enhance crawl_page_snapshots with comparison state & headings hierarchy
ALTER TABLE crawl_page_snapshots ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64);
ALTER TABLE crawl_page_snapshots ADD COLUMN IF NOT EXISTS headings JSONB DEFAULT '[]';
ALTER TABLE crawl_page_snapshots ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE crawl_page_snapshots ADD COLUMN IF NOT EXISTS status_change VARCHAR(20) DEFAULT 'NEW';

-- 4. Page link graph table for internal linking and orphan page detection
CREATE TABLE IF NOT EXISTS page_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    crawl_run_id UUID NOT NULL REFERENCES crawl_runs(id) ON DELETE CASCADE,
    source_url TEXT NOT NULL,
    target_url TEXT NOT NULL,
    anchor_text TEXT,
    is_internal BOOLEAN NOT NULL,
    rel TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_page_links_tenant_website ON page_links(organization_id, website_id);
CREATE INDEX IF NOT EXISTS idx_page_links_target ON page_links(target_url);

-- 5. Knowledge candidate verification status differentiation
ALTER TABLE knowledge_entities ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'AUTHORITATIVE';
ALTER TABLE knowledge_entities ADD COLUMN IF NOT EXISTS discovery_source_url TEXT;
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_status ON knowledge_entities(organization_id, verification_status);

-- 6. SEO issues description column
ALTER TABLE seo_issues ADD COLUMN IF NOT EXISTS description TEXT;

-- 7. Update check constraints for Phase 2 crawl states and severity levels
ALTER TABLE crawl_runs DROP CONSTRAINT IF EXISTS crawl_runs_status_check;
ALTER TABLE crawl_runs ADD CONSTRAINT crawl_runs_status_check CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED', 'PENDING'));

ALTER TABLE seo_issues DROP CONSTRAINT IF EXISTS seo_issues_severity_check;
ALTER TABLE seo_issues ADD CONSTRAINT seo_issues_severity_check CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'WARNING', 'INFO'));
