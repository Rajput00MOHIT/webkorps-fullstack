-- ====================================================================
-- Corp Talk: Production Multi-Tenant Schema (PostgreSQL + pgvector)
-- Tenant 0 (Dogfood): Webkorps
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. ORGANIZATIONS & TENANTS
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    tier VARCHAR(50) DEFAULT 'STANDARD',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS & RBAC
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organization_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'EDITOR', 'SEO_MANAGER', 'CONTENT_MANAGER', 'SALES', 'VIEWER')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. WEBSITES & CRAWLER STORAGE
CREATE TABLE IF NOT EXISTS websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(50) DEFAULT 'VERIFIED',
    crawl_interval_hours INT DEFAULT 24,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crawl_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED')),
    pages_discovered INT DEFAULT 0,
    pages_crawled INT DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    path TEXT NOT NULL,
    canonical_url TEXT,
    http_status INT DEFAULT 200,
    title TEXT,
    meta_description TEXT,
    word_count INT DEFAULT 0,
    content_hash VARCHAR(64),
    last_crawled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(website_id, url)
);

CREATE TABLE IF NOT EXISTS crawl_page_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    crawl_run_id UUID NOT NULL REFERENCES crawl_runs(id) ON DELETE CASCADE,
    h1_tags TEXT[] DEFAULT '{}',
    h2_tags TEXT[] DEFAULT '{}',
    h3_tags TEXT[] DEFAULT '{}',
    images JSONB DEFAULT '[]',
    links_internal JSONB DEFAULT '[]',
    links_external JSONB DEFAULT '[]',
    schema_jsonld JSONB DEFAULT '[]',
    extracted_text TEXT,
    crawled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seo_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
    issue_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'WARNING', 'INFO')),
    evidence JSONB DEFAULT '{}',
    recommendation TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED', 'IGNORED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. KNOWLEDGE GRAPH & VECTOR STORE
CREATE TABLE IF NOT EXISTS knowledge_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('COMPANY', 'SERVICE', 'INDUSTRY', 'TECHNOLOGY', 'OFFICE', 'LEADER', 'CLIENT', 'PARTNER', 'CASE_STUDY', 'CERTIFICATION', 'EVENT', 'BLOG', 'FAQ', 'CLAIM')),
    name VARCHAR(255) NOT NULL,
    attributes JSONB DEFAULT '{}',
    source_url TEXT,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledge_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    from_entity_id UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
    relation_type VARCHAR(50) NOT NULL CHECK (relation_type IN ('PROVIDES', 'SERVES', 'USES', 'HEADQUARTERED_AT', 'HAS_OFFICE', 'LED_BY', 'HAS_CASE_STUDY', 'HAS_CERTIFICATION', 'HAS_BLOG', 'RELATED_TO')),
    to_entity_id UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledge_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES knowledge_entities(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    embedding vector(384) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. GEO & AI VISIBILITY INTELLIGENCE
CREATE TABLE IF NOT EXISTS ai_engines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engine_key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ai_visibility_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    schedule_cron VARCHAR(50) DEFAULT '0 0 * * *',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_observation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    prompt_id UUID NOT NULL REFERENCES ai_visibility_prompts(id) ON DELETE CASCADE,
    ai_engine_id UUID NOT NULL REFERENCES ai_engines(id) ON DELETE CASCADE,
    raw_prompt TEXT NOT NULL,
    raw_response_text TEXT NOT NULL,
    response_metadata JSONB DEFAULT '{}',
    observed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    observation_id UUID NOT NULL REFERENCES ai_observation_runs(id) ON DELETE CASCADE,
    brand_name VARCHAR(255) NOT NULL,
    is_target_brand BOOLEAN DEFAULT FALSE,
    mention_position INT,
    context_snippet TEXT
);

CREATE TABLE IF NOT EXISTS ai_citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    observation_id UUID NOT NULL REFERENCES ai_observation_runs(id) ON DELETE CASCADE,
    cited_url TEXT NOT NULL,
    cited_domain VARCHAR(255) NOT NULL,
    is_target_owned BOOLEAN DEFAULT FALSE,
    citation_order INT
);

-- 6. COMPETITORS & OPPORTUNITIES
CREATE TABLE IF NOT EXISTS competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    core_capabilities TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    query TEXT NOT NULL,
    problem_statement TEXT NOT NULL,
    evidence JSONB DEFAULT '{}',
    competitors_cited TEXT[] DEFAULT '{}',
    missing_proof_points TEXT[] DEFAULT '{}',
    impact_score INT DEFAULT 50,
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
    recommended_action TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'NEW' CHECK (status IN ('NEW', 'IN_PROGRESS', 'ADDRESSED', 'DISMISSED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. CONTENT PIPELINE (Human-in-the-Loop)
CREATE TABLE IF NOT EXISTS content_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    target_keyword VARCHAR(255) NOT NULL,
    search_intent VARCHAR(100),
    status VARCHAR(50) DEFAULT 'IDEA' CHECK (status IN ('IDEA', 'RESEARCHING', 'BRIEF_READY', 'DRAFTING', 'QA', 'REVIEW', 'APPROVED', 'PUBLISHED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    content_project_id UUID NOT NULL REFERENCES content_projects(id) ON DELETE CASCADE,
    primary_keyword VARCHAR(255) NOT NULL,
    secondary_keywords TEXT[] DEFAULT '{}',
    questions_to_answer TEXT[] DEFAULT '{}',
    recommended_outline JSONB DEFAULT '[]',
    competitor_urls TEXT[] DEFAULT '{}',
    authority_sources JSONB DEFAULT '[]',
    internal_link_targets JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    content_project_id UUID NOT NULL REFERENCES content_projects(id) ON DELETE CASCADE,
    version INT DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    body_markdown TEXT NOT NULL,
    meta_title VARCHAR(255),
    meta_description TEXT,
    schema_markup JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'QA_PASSED', 'APPROVED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    draft_id UUID NOT NULL REFERENCES content_drafts(id) ON DELETE CASCADE,
    fact_check_score INT DEFAULT 100,
    seo_score INT DEFAULT 100,
    originality_score INT DEFAULT 100,
    flags JSONB DEFAULT '[]',
    reviewer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. WEBSITE ASSISTANT & LEADS
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'ai', 'system')),
    text TEXT NOT NULL,
    suggested_actions JSONB DEFAULT '[]',
    retrieved_evidence JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    company VARCHAR(255),
    message TEXT NOT NULL,
    score_category VARCHAR(20) DEFAULT 'WARM' CHECK (score_category IN ('HOT', 'WARM', 'COLD')),
    score_reasons TEXT[] DEFAULT '{}',
    source VARCHAR(50) DEFAULT 'CONTACT_FORM' CHECK (source IN ('CONTACT_FORM', 'AI_ASSISTANT')),
    status VARCHAR(50) DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. ANALYTICS & INTEGRATIONS
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    label VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    integration_type VARCHAR(50) NOT NULL CHECK (integration_type IN ('CRM', 'CMS', 'SEARCH', 'ANALYTICS')),
    provider_name VARCHAR(100) NOT NULL,
    config_encrypted JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. INDEXES FOR PERFORMANCE & TENANT ISOLATION
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant ON organization_memberships(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_websites_tenant ON websites(organization_id);
CREATE INDEX IF NOT EXISTS idx_pages_tenant_website ON pages(organization_id, website_id);
CREATE INDEX IF NOT EXISTS idx_seo_issues_tenant ON seo_issues(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_tenant ON knowledge_entities(organization_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_relations_tenant ON knowledge_relations(organization_id, relation_type);
CREATE INDEX IF NOT EXISTS idx_opportunities_tenant ON opportunities(organization_id, priority, status);
CREATE INDEX IF NOT EXISTS idx_content_projects_tenant ON content_projects(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON conversations(organization_id, session_id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(organization_id, score_category, status);
CREATE INDEX IF NOT EXISTS idx_analytics_tenant ON analytics_events(organization_id, event_name);

-- 11. DEFAULT ENGINES SEED
INSERT INTO ai_engines (engine_key, name) VALUES
    ('OPENAI_SEARCH', 'ChatGPT Search (OpenAI)'),
    ('PERPLEXITY', 'Perplexity AI'),
    ('GEMINI', 'Google Gemini / AI Overviews'),
    ('CLAUDE', 'Anthropic Claude'),
    ('COPILOT', 'Microsoft Copilot')
ON CONFLICT (engine_key) DO NOTHING;
