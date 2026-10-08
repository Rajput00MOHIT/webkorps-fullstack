-- ====================================================================
-- Corp Talk: Knowledge Graph & Assistant Intelligence Upgrade
-- ====================================================================

-- 1. Extend knowledge_entities columns for trust & qualitative confidence
ALTER TABLE knowledge_entities ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) DEFAULT 'CURATED_COMPANY_DATA';
ALTER TABLE knowledge_entities ADD COLUMN IF NOT EXISTS confidence VARCHAR(50) DEFAULT 'VERIFIED';
ALTER TABLE knowledge_entities ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'VERIFIED';
ALTER TABLE knowledge_entities ADD COLUMN IF NOT EXISTS discovery_source_url TEXT;

-- 2. Relax entity_type check constraint to include 'CAPABILITY'
ALTER TABLE knowledge_entities DROP CONSTRAINT IF EXISTS knowledge_entities_entity_type_check;
ALTER TABLE knowledge_entities ADD CONSTRAINT knowledge_entities_entity_type_check 
    CHECK (entity_type IN ('COMPANY', 'SERVICE', 'INDUSTRY', 'TECHNOLOGY', 'CAPABILITY', 'OFFICE', 'LEADER', 'CLIENT', 'PARTNER', 'CASE_STUDY', 'CERTIFICATION', 'EVENT', 'BLOG', 'FAQ', 'CLAIM'));

-- 3. Relax relation_type check constraint to include 'DEMONSTRATES', 'SUPPORTS', 'RELEVANT_TO'
ALTER TABLE knowledge_relations DROP CONSTRAINT IF EXISTS knowledge_relations_relation_type_check;
ALTER TABLE knowledge_relations ADD CONSTRAINT knowledge_relations_relation_type_check 
    CHECK (relation_type IN ('PROVIDES', 'SERVES', 'USES', 'HEADQUARTERED_AT', 'HAS_OFFICE', 'LED_BY', 'HAS_CASE_STUDY', 'HAS_CERTIFICATION', 'HAS_BLOG', 'RELATED_TO', 'DEMONSTRATES', 'SUPPORTS', 'RELEVANT_TO'));

-- 4. Create Assistant Evaluation Runs table
CREATE TABLE IF NOT EXISTS assistant_evaluation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    benchmark_name VARCHAR(100) NOT NULL DEFAULT 'Webkorps Core Intelligence Benchmark',
    total_cases INT NOT NULL,
    passed_cases INT NOT NULL,
    failed_cases INT NOT NULL,
    intent_accuracy_rate NUMERIC(5,2) NOT NULL,
    entity_extraction_rate NUMERIC(5,2) NOT NULL,
    context_retention_rate NUMERIC(5,2) NOT NULL,
    hallucination_rate NUMERIC(5,2) NOT NULL,
    unknown_handling_rate NUMERIC(5,2) NOT NULL,
    metrics JSONB DEFAULT '{}',
    results JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
