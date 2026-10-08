-- ============================================================================
-- Migration 012: Knowledge Intelligence, Semantic Chunking & Conflict Storage
-- ============================================================================

-- 1. Extend pages table with Page Classification metadata
ALTER TABLE pages ADD COLUMN IF NOT EXISTS page_type VARCHAR(64) DEFAULT 'OTHER';
ALTER TABLE pages ADD COLUMN IF NOT EXISTS classification_confidence NUMERIC(4,2) DEFAULT 1.0;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS classification_method VARCHAR(64) DEFAULT 'DETERMINISTIC';

-- 2. Create Knowledge Conflicts table for tracking contradictory claims across pages
CREATE TABLE IF NOT EXISTS knowledge_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  claim_type VARCHAR(64) NOT NULL,
  claim_subject VARCHAR(255) NOT NULL,
  source_a_url TEXT NOT NULL,
  source_a_value TEXT NOT NULL,
  source_a_timestamp TIMESTAMPTZ DEFAULT NOW(),
  source_b_url TEXT NOT NULL,
  source_b_value TEXT NOT NULL,
  source_b_timestamp TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(32) DEFAULT 'DETECTED', -- DETECTED, RESOLVED, UNCERTAIN
  resolution_strategy VARCHAR(64), -- NEWEST_SOURCE, HIGHEST_AUTHORITY, EXPLICIT_UNCERTAINTY, MANUAL
  resolved_value TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kg_conflicts_org ON knowledge_conflicts(organization_id);
CREATE INDEX IF NOT EXISTS idx_kg_conflicts_status ON knowledge_conflicts(status);

-- 3. Create Knowledge Chunks table for semantic section & paragraph retrieval
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES knowledge_entities(id) ON DELETE SET NULL,
  section_heading VARCHAR(255),
  chunk_text TEXT NOT NULL,
  chunk_type VARCHAR(64) NOT NULL DEFAULT 'PARAGRAPH', -- HEADING_SECTION, FAQ_ITEM, CASE_STUDY_FEATURE, SERVICE_DELIVERABLE
  position INT DEFAULT 0,
  source_url TEXT NOT NULL,
  content_hash VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kg_chunks_org ON knowledge_chunks(organization_id);
CREATE INDEX IF NOT EXISTS idx_kg_chunks_page ON knowledge_chunks(page_id);
CREATE INDEX IF NOT EXISTS idx_kg_chunks_type ON knowledge_chunks(chunk_type);

-- 4. Create Knowledge Feedback table for continuous learning
CREATE TABLE IF NOT EXISTS knowledge_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  feedback_type VARCHAR(64) NOT NULL, -- HELPFUL, NOT_HELPFUL, WRONG_INTENT, WRONG_INFORMATION, MISSING_INFORMATION, IRRELEVANT, HALLUCINATION, OUTDATED
  user_comment TEXT,
  corrected_intent VARCHAR(64),
  corrected_entities JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(32) DEFAULT 'NEW', -- NEW, PROCESSED, DISCARDED
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kg_feedback_org ON knowledge_feedback(organization_id);
CREATE INDEX IF NOT EXISTS idx_kg_feedback_type ON knowledge_feedback(feedback_type);
