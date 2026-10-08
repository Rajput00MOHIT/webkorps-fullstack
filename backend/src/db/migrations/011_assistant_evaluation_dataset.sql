-- ============================================================================
-- Migration 011: Assistant 1000+ Question Evaluation & Benchmark Dataset
-- ============================================================================

CREATE TABLE IF NOT EXISTS assistant_evaluation_questions (
  id VARCHAR(64) PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  category VARCHAR(64) NOT NULL,
  subcategory VARCHAR(128) NOT NULL,
  intent VARCHAR(64) NOT NULL,
  query_type VARCHAR(64) NOT NULL,
  knowledge_scope VARCHAR(64) NOT NULL,
  difficulty VARCHAR(32) NOT NULL,
  industry VARCHAR(64),
  service VARCHAR(128),
  technology VARCHAR(64),
  conversation_id VARCHAR(64),
  turn_number INT DEFAULT 1,
  previous_turns JSONB DEFAULT '[]'::jsonb,
  expected_context JSONB DEFAULT '{}'::jsonb,
  expected_entities JSONB DEFAULT '[]'::jsonb,
  expected_answer_type VARCHAR(64) NOT NULL,
  expected_source_type VARCHAR(64) NOT NULL,
  expected_behavior VARCHAR(64) NOT NULL,
  hallucination_risk BOOLEAN DEFAULT false,
  requires_research BOOLEAN DEFAULT false,
  requires_context BOOLEAN DEFAULT false,
  expected_citation TEXT,
  expected_unknown_behavior BOOLEAN DEFAULT false,
  ground_truth TEXT,
  ground_truth_source VARCHAR(64),
  source_url TEXT,
  review_status VARCHAR(32) DEFAULT 'APPROVED',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asst_eval_q_org ON assistant_evaluation_questions(organization_id);
CREATE INDEX IF NOT EXISTS idx_asst_eval_q_cat ON assistant_evaluation_questions(category);
CREATE INDEX IF NOT EXISTS idx_asst_eval_q_intent ON assistant_evaluation_questions(intent);
CREATE INDEX IF NOT EXISTS idx_asst_eval_q_scope ON assistant_evaluation_questions(knowledge_scope);
