import { db } from '../../db/client.js';
import { defaultEmbeddingProvider } from '../../providers/embedding/localEmbedding.provider.js';
import { PageClassifier } from '../crawler/pageClassifier.js';
import type { PageType } from '../crawler/pageClassifier.js';

export interface IngestPageInput {
  organizationId: string;
  pageId?: string;
  url: string;
  title: string;
  metaDescription?: string;
  headings: { h1: string[]; h2: string[]; h3: string[] };
  cleanText: string;
  schemas?: any[];
  links?: any[];
}

export interface IngestionSummary {
  pagesProcessed: number;
  entitiesExtracted: number;
  relationshipsCreated: number;
  chunksCreated: number;
  conflictsDetected: number;
  embeddingsGenerated: number;
}

export class KnowledgeIngestionEngine {
  /**
   * Processes a crawled or uploaded page, classifies it, extracts structured entities,
   * detects data conflicts, creates semantic chunks, and indexes embeddings into pgvector.
   */
  public static async ingestPage(input: IngestPageInput): Promise<{
    pageType: PageType;
    entitiesCount: number;
    chunksCount: number;
    conflictsCount: number;
  }> {
    const { organizationId, url, title, headings, cleanText } = input;

    // 1. Classify Page
    const classification = PageClassifier.classify(url, title, headings, cleanText);

    // Update pages table if pageId is present
    if (input.pageId) {
      await db.query(
        `UPDATE pages
         SET page_type = $1, classification_confidence = $2, classification_method = $3
         WHERE id = $4`,
        [classification.pageType, classification.confidence, classification.method, input.pageId]
      );
    }

    let entitiesCount = 0;
    let conflictsCount = 0;
    let chunksCount = 0;

    // 2. Extract Entities by Page Classification
    const lowerText = cleanText.toLowerCase();

    // A. COMPANY FACTS & CONFLICT DETECTION
    if (classification.pageType === 'ABOUT' || classification.pageType === 'HOME') {
      // Check for Headcount / Team Size
      const teamMatch = cleanText.match(/\b(\d{2,4}\+?)\s*(?:engineers|developers|professionals|specialists|team members)\b/i);
      if (teamMatch) {
        const teamClaim = teamMatch[0];
        // Check existing company entity for conflict
        const compEnt = await db.query(
          `SELECT id, attributes FROM knowledge_entities WHERE organization_id = $1 AND entity_type = 'COMPANY' LIMIT 1`,
          [organizationId]
        );
        if (compEnt.rows.length > 0) {
          const currentTeam = compEnt.rows[0].attributes?.teamSize;
          if (currentTeam && currentTeam.toLowerCase() !== teamClaim.toLowerCase()) {
            await this.recordConflict(
              organizationId,
              'HEADCOUNT',
              'Webkorps Team Size',
              'https://www.webkorps.com/about-us',
              currentTeam,
              url,
              teamClaim,
              'NEWEST_SOURCE',
              teamClaim
            );
            conflictsCount++;
          }
        }
      }
    }

    // B. SERVICE EXTRACTION
    if (classification.pageType === 'SERVICE' || classification.pageType === 'SUBSERVICE') {
      const serviceName = headings.h1[0] || title.split('|')[0].trim();
      if (serviceName && serviceName.length > 3) {
        const serviceEnt = await this.upsertEntity(
          organizationId,
          'SERVICE',
          serviceName,
          {
            overview: headings.h2.slice(0, 3).join('. '),
            sourcePageType: classification.pageType,
            description: cleanText.slice(0, 500)
          },
          url
        );
        entitiesCount++;

        // Link Company -> OFFERS -> Service
        await this.linkCompanyToEntity(organizationId, serviceEnt.id, 'PROVIDES');
      }
    }

    // C. TECHNOLOGY EXTRACTION
    const knownTechCatalog = [
      { name: 'Ruby on Rails', category: 'Backend Framework' },
      { name: 'Java', category: 'Enterprise Backend' },
      { name: 'Android', category: 'Mobile Platform' },
      { name: 'iOS', category: 'Mobile Platform' },
      { name: 'Python', category: 'Backend & AI' },
      { name: '.NET', category: 'Enterprise Framework' },
      { name: 'React Native', category: 'Mobile Framework' },
      { name: 'PHP', category: 'Web Backend' },
      { name: 'Flutter', category: 'Mobile Framework' },
      { name: 'React', category: 'Frontend Library' },
      { name: 'Next.js', category: 'Frontend Framework' },
      { name: 'Node.js', category: 'Backend Runtime' },
      { name: 'Go', category: 'Backend Language' },
      { name: 'PostgreSQL', category: 'Relational Database' },
      { name: 'PostGIS', category: 'Geospatial Database' },
      { name: 'Kafka', category: 'Event Streaming' },
      { name: 'Redis', category: 'In-Memory Cache' },
      { name: 'Docker', category: 'DevOps & Containers' },
      { name: 'Kubernetes', category: 'Container Orchestration' },
      { name: 'AWS', category: 'Cloud Platform' },
      { name: 'Google Cloud Platform', category: 'Cloud Platform' }
    ];

    for (const tech of knownTechCatalog) {
      const regex = new RegExp(`\\b${tech.name.replace('.', '\\.')}\\b`, 'i');
      if (regex.test(cleanText)) {
        const techEnt = await this.upsertEntity(
          organizationId,
          'TECHNOLOGY',
          tech.name,
          {
            category: tech.category,
            mentionedInUrl: url
          },
          url
        );
        entitiesCount++;
        await this.linkCompanyToEntity(organizationId, techEnt.id, 'USES');
      }
    }

    // D. CASE STUDY EXTRACTION
    if (classification.pageType === 'CASE_STUDY' || lowerText.includes('case study') || lowerText.includes('cryoport')) {
      const caseTitle = headings.h1[0] || title.split('|')[0].trim();
      let client = caseTitle;
      let industry = 'General Enterprise';

      if (lowerText.includes('cryoport') || url.includes('cryoport')) {
        client = 'Cryoport';
        industry = 'Logistics & Supply Chain';
      } else if (lowerText.includes('cigna')) {
        client = 'Cigna';
        industry = 'Healthcare & HealthTech';
      } else if (lowerText.includes('paypal')) {
        client = 'PayPal';
        industry = 'FinTech & Payment Solutions';
      }

      if (caseTitle && caseTitle.length > 4) {
        const csEnt = await this.upsertEntity(
          organizationId,
          'CASE_STUDY',
          caseTitle,
          {
            client,
            industry,
            summary: cleanText.slice(0, 600),
            sourceUrl: url
          },
          url
        );
        entitiesCount++;
        await this.linkCompanyToEntity(organizationId, csEnt.id, 'HAS_CASE_STUDY');
      }
    }

    // E. FAQ EXTRACTION
    const faqPairs = this.extractFaqPairs(cleanText, headings);
    for (const faq of faqPairs) {
      const faqEnt = await this.upsertEntity(
        organizationId,
        'FAQ',
        faq.question,
        {
          answer: faq.answer,
          sourceUrl: url
        },
        url
      );
      entitiesCount++;

      // Create embedding for instant FAQ match
      await this.createEmbedding(
        organizationId,
        faqEnt.id,
        `Q: ${faq.question} A: ${faq.answer}`
      );
    }

    // 3. Semantic Chunking (by Heading & Paragraphs)
    const chunks = this.createSemanticChunks(cleanText, headings, url);
    for (let idx = 0; idx < chunks.length; idx++) {
      const ch = chunks[idx];
      const insertRes = await db.query(
        `INSERT INTO knowledge_chunks (
           organization_id, page_id, section_heading, chunk_text, chunk_type, position, source_url
         ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [organizationId, input.pageId || null, ch.heading, ch.text, ch.type, idx, url]
      );
      chunksCount++;

      // Create vector embedding for semantic chunk
      const chunkId = insertRes.rows[0].id;
      await this.createChunkEmbedding(organizationId, chunkId, ch.text);
    }

    return {
      pageType: classification.pageType,
      entitiesCount,
      chunksCount,
      conflictsCount
    };
  }

  /**
   * Helper to record knowledge conflicts across sources
   */
  public static async recordConflict(
    organizationId: string,
    claimType: string,
    claimSubject: string,
    sourceAUrl: string,
    sourceAValue: string,
    sourceBUrl: string,
    sourceBValue: string,
    strategy: string = 'NEWEST_SOURCE',
    resolvedValue?: string
  ): Promise<void> {
    await db.query(
      `INSERT INTO knowledge_conflicts (
         organization_id, claim_type, claim_subject, source_a_url, source_a_value,
         source_b_url, source_b_value, status, resolution_strategy, resolved_value
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'DETECTED', $8, $9)`,
      [organizationId, claimType, claimSubject, sourceAUrl, sourceAValue, sourceBUrl, sourceBValue, strategy, resolvedValue || sourceBValue]
    );
  }

  /**
   * Upserts knowledge entities with trust metadata
   */
  private static async upsertEntity(
    organizationId: string,
    entityType: string,
    name: string,
    attributes: Record<string, any>,
    sourceUrl: string
  ): Promise<{ id: string }> {
    const existing = await db.query(
      `SELECT id FROM knowledge_entities WHERE organization_id = $1 AND entity_type = $2 AND LOWER(name) = LOWER($3)`,
      [organizationId, entityType, name.trim()]
    );

    if (existing.rows.length > 0) {
      await db.query(
        `UPDATE knowledge_entities
         SET attributes = attributes || $1::jsonb, source_url = $2
         WHERE id = $3`,
        [JSON.stringify(attributes), sourceUrl, existing.rows[0].id]
      );
      return existing.rows[0];
    }

    const insertRes = await db.query(
      `INSERT INTO knowledge_entities (
         organization_id, entity_type, name, attributes, source_url,
         is_verified, verification_status, source_type, confidence
       ) VALUES ($1, $2, $3, $4, $5, TRUE, 'VERIFIED', 'OFFICIAL_WEBSITE', 'HIGH_CONFIDENCE')
       RETURNING id`,
      [organizationId, entityType, name.trim(), JSON.stringify(attributes), sourceUrl]
    );

    return insertRes.rows[0];
  }

  /**
   * Connects Company node to service / tech / case study node in Knowledge Graph
   */
  private static async linkCompanyToEntity(
    organizationId: string,
    targetEntityId: string,
    relationType: 'PROVIDES' | 'USES' | 'SERVES' | 'HAS_CASE_STUDY' | 'HAS_OFFICE'
  ): Promise<void> {
    const companyRes = await db.query(
      `SELECT id FROM knowledge_entities WHERE organization_id = $1 AND entity_type = 'COMPANY' LIMIT 1`,
      [organizationId]
    );
    if (companyRes.rows.length === 0) return;

    const companyId = companyRes.rows[0].id;
    await db.query(
      `INSERT INTO knowledge_relations (organization_id, from_entity_id, relation_type, to_entity_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [organizationId, companyId, relationType, targetEntityId]
    );
  }

  /**
   * Extracts FAQ Question/Answer pairs from text or headings
   */
  private static extractFaqPairs(cleanText: string, headings: { h1: string[]; h2: string[]; h3: string[] }): Array<{ question: string; answer: string }> {
    const faqs: Array<{ question: string; answer: string }> = [];
    const questionHeadings = [...headings.h2, ...headings.h3].filter(h => h.includes('?') || h.toLowerCase().startsWith('what') || h.toLowerCase().startsWith('how') || h.toLowerCase().startsWith('why'));

    for (const q of questionHeadings) {
      const qIdx = cleanText.indexOf(q);
      if (qIdx !== -1) {
        const subsequentText = cleanText.slice(qIdx + q.length, qIdx + q.length + 300).trim();
        if (subsequentText.length > 20) {
          faqs.push({
            question: q,
            answer: subsequentText.split('\n')[0].trim()
          });
        }
      }
    }
    return faqs;
  }

  /**
   * Splits text into semantic chunks by section and paragraph blocks
   */
  private static createSemanticChunks(
    cleanText: string,
    headings: { h1: string[]; h2: string[]; h3: string[] },
    sourceUrl: string
  ): Array<{ heading: string; text: string; type: string }> {
    const chunks: Array<{ heading: string; text: string; type: string }> = [];
    const paragraphs = cleanText.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 60);

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const matchedHeading = headings.h2[i] || headings.h1[0] || 'Overview';
      chunks.push({
        heading: matchedHeading,
        text: p,
        type: 'PARAGRAPH'
      });
    }

    return chunks.slice(0, 15); // Guardrail max 15 semantic chunks per page
  }

  /**
   * Creates vector embedding for knowledge entity
   */
  private static async createEmbedding(organizationId: string, entityId: string, text: string): Promise<void> {
    try {
      const emb = await defaultEmbeddingProvider.generateEmbedding(text);
      const vecStr = `[${emb.join(',')}]`;
      await db.query(
        `INSERT INTO knowledge_embeddings (organization_id, entity_id, chunk_text, embedding)
         VALUES ($1, $2, $3, $4::vector)`,
        [organizationId, entityId, text, vecStr]
      );
    } catch (e: any) {
      console.warn('[Knowledge Ingestion Engine] Embedding error:', e.message);
    }
  }

  /**
   * Creates vector embedding for semantic chunk
   */
  private static async createChunkEmbedding(organizationId: string, chunkId: string, text: string): Promise<void> {
    try {
      const emb = await defaultEmbeddingProvider.generateEmbedding(text);
      const vecStr = `[${emb.join(',')}]`;
      await db.query(
        `INSERT INTO knowledge_embeddings (organization_id, chunk_text, embedding)
         VALUES ($1, $2, $3::vector)`,
        [organizationId, text, vecStr]
      );
    } catch (e: any) {
      console.warn('[Knowledge Ingestion Engine] Chunk embedding error:', e.message);
    }
  }
}
