import { db } from '../../db/client.js';
import { KnowledgeService } from '../knowledge/knowledgeService.js';
import { ResearchService } from '../research/researchService.js';
import type {
  RetrievalItem,
  ConfidenceLevel,
  AssistantMode,
  ConversationContext
} from './assistantTypes.js';

export interface RetrievalEngineOptions {
  organizationId: string;
  query: string;
  intent?: AssistantMode;
  context?: ConversationContext;
  websiteId?: string;
  maxItems?: number;
  includeResearch?: boolean;
}

export interface RetrievalEngineResult {
  items: RetrievalItem[];
  confidence: ConfidenceLevel;
  queryExpansions?: string[];
  externalEvidenceCount?: number;
}

export class AssistantRetrievalEngine {
  /**
   * Multi-tier retrieval across Authoritative Knowledge Graph, Approved Content,
   * Crawled Website Pages, and Verified Research Evidence.
   */
  public static async retrieve(options: RetrievalEngineOptions): Promise<RetrievalEngineResult> {
    const {
      organizationId,
      query,
      intent,
      context,
      websiteId,
      maxItems = 8,
      includeResearch = false
    } = options;

    const items: RetrievalItem[] = [];
    const queryLower = query.toLowerCase();
    const queryTokens = queryLower
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !['the', 'and', 'for', 'are', 'what', 'how', 'about', 'can', 'you', 'with', 'our', 'this', 'that', 'give', 'tell'].includes(w));

    // -------------------------------------------------------------
    // TIER 1: Authoritative Knowledge Graph (Entities & Semantic Chunks)
    // -------------------------------------------------------------
    try {
      const entityRes = await db.query(
        `SELECT id, name, entity_type, attributes, source_url, source_type, confidence, verification_status
         FROM knowledge_entities
         WHERE organization_id = $1`,
        [organizationId]
      );

      for (const ent of entityRes.rows) {
        const entName = (ent.name || '').toLowerCase();
        const entType = ent.entity_type;
        const attrStr = JSON.stringify(ent.attributes || {}).toLowerCase();

        let isMatch = false;
        let relevance = 0.5;

        // Exact name or token match
        if (queryLower.includes(entName) || entName.includes(queryLower)) {
          isMatch = true;
          relevance = 0.98;
        } else {
          const matchingTokens = queryTokens.filter(t => entName.includes(t) || attrStr.includes(t));
          if (matchingTokens.length > 0) {
            isMatch = true;
            relevance = Math.min(0.95, 0.75 + matchingTokens.length * 0.08);
          }
        }

        // Industry Match
        if (context?.detectedIndustry && entType === 'INDUSTRY') {
          if (entName.includes(context.detectedIndustry) || attrStr.includes(context.detectedIndustry)) {
            isMatch = true;
            relevance = Math.max(relevance, 0.92);
          }
        }

        // Service Match for project requirements, features, or technology
        if (
          (intent === 'SERVICE_QA' || intent === 'TECHNOLOGY_QA' || intent === 'PROJECT_REQUIREMENT' || intent === 'FEATURE_QA' || intent === 'DYNAMIC_RESEARCH') &&
          entType === 'SERVICE'
        ) {
          if (queryTokens.some(t => entName.includes(t) || attrStr.includes(t)) || ['mobile', 'app', 'web', 'custom', 'cloud', 'devops', 'software', 'ai', 'qa', 'design'].some(k => queryLower.includes(k))) {
            isMatch = true;
            relevance = Math.max(relevance, 0.85);
          }
        }

        // Technology Match
        if (
          (intent === 'TECHNOLOGY_QA' || intent === 'PROJECT_REQUIREMENT' || intent === 'FEATURE_QA' || intent === 'DYNAMIC_RESEARCH') &&
          entType === 'TECHNOLOGY'
        ) {
          if (queryTokens.some(t => entName.includes(t)) || (context?.detectedIndustry && ['flutter', 'react native', 'node.js', 'postgresql', 'postgis', 'redis', 'aws'].includes(entName))) {
            isMatch = true;
            relevance = Math.max(relevance, 0.88);
          }
        }

        // Capability Match
        if (
          (intent === 'FEATURE_QA' || intent === 'PROJECT_REQUIREMENT' || intent === 'SERVICE_QA' || intent === 'DYNAMIC_RESEARCH') &&
          entType === 'CAPABILITY'
        ) {
          if (queryTokens.some(t => entName.includes(t) || attrStr.includes(t))) {
            isMatch = true;
            relevance = Math.max(relevance, 0.86);
          }
        }

        // Case Study Match
        if (entType === 'CASE_STUDY') {
          if (intent === 'CASE_STUDY_QA') {
            const isTargetDomain = (context?.detectedIndustry && (entName.includes(context.detectedIndustry) || attrStr.includes(context.detectedIndustry))) ||
              queryTokens.some(t => entName.includes(t) || attrStr.includes(t));
            isMatch = true;
            relevance = isTargetDomain ? 0.99 : 0.95;
          } else if (queryTokens.some(t => entName.includes(t) || attrStr.includes(t))) {
            isMatch = true;
            relevance = 0.92;
          }
        }

        // FAQ Match
        if (entType === 'FAQ') {
          if (queryTokens.some(t => entName.includes(t) || attrStr.includes(t))) {
            isMatch = true;
            relevance = (intent === 'CASE_STUDY_QA') ? 0.80 : 0.91;
          }
        }

        // Company Match
        if ((intent === 'COMPANY_QA' || intent === 'DYNAMIC_RESEARCH') && (entType === 'COMPANY' || entType === 'ORGANIZATION' || entType === 'LEADER' || entType === 'OFFICE' || entType === 'CERTIFICATION')) {
          isMatch = true;
          relevance = 0.96;
        }

        if (isMatch) {
          const trustLevel: any = ent.verification_status === 'DISCOVERED' ? 'ORGANIZATION_WEBSITE' : 'AUTHORITATIVE_KG';
          const attrs = ent.attributes || {};
          const readableContent = attrs.overview || attrs.description || attrs.answer || attrs.question || (attrs.client ? `Client: ${attrs.client}. ${attrs.solution || ''}` : `${ent.name}: Webkorps engineering capability.`);
          items.push({
            source_type: 'KNOWLEDGE_ENTITY',
            source_id: ent.id,
            title: ent.name,
            content: readableContent,
            trust_level: trustLevel,
            verification_status: ent.verification_status || 'VERIFIED',
            relevance,
            metadata: {
              entity_type: ent.entity_type,
              attributes: ent.attributes,
              source_type: ent.source_type || 'CURATED_COMPANY_DATA',
              confidence: ent.confidence || 'VERIFIED'
            }
          });
        }
      }

      // 1b. Semantic pgvector search if vector embeddings exist
      try {
        const semanticMatches = await KnowledgeService.searchSemantic(organizationId, query, 4);
        for (const sm of semanticMatches) {
          if (sm.distance < 0.55) {
            if (!items.some(i => i.source_id === sm.entity_id || i.title === sm.name)) {
              const trustLevel: any = sm.verification_status === 'DISCOVERED' ? 'ORGANIZATION_WEBSITE' : 'AUTHORITATIVE_KG';
              const sAttrs = sm.attributes || {};
              const sContent = sm.chunk_text || sAttrs.overview || sAttrs.description || `${sm.name} verified engineering capabilities.`;
              items.push({
                source_type: 'KNOWLEDGE_ENTITY',
                source_id: sm.embedding_id || sm.entity_id,
                title: sm.name || 'Verified Ground Truth',
                content: sContent,
                trust_level: trustLevel,
                verification_status: sm.verification_status || 'VERIFIED',
                relevance: Math.max(0.65, 1.0 - sm.distance),
                metadata: {
                  entity_type: sm.entity_type,
                  source_type: sm.source_type || 'CURATED_COMPANY_DATA',
                  confidence: sm.confidence || 'VERIFIED'
                }
              });
            }
          }
        }
      } catch (embErr) {
        // Vector search is an enhancement over KG sql matching
      }
    } catch (err) {
      console.warn('[AssistantRetrieval] KG search error:', err);
    }

    // -------------------------------------------------------------
    // TIER 2: Approved Phase 6 Content
    // -------------------------------------------------------------
    try {
      const contentRes = await db.query(
        `SELECT d.id, d.title, d.meta_description, d.body_markdown, p.target_keyword, p.content_type
         FROM content_drafts d
         JOIN content_projects p ON p.id = d.content_project_id
         WHERE d.organization_id = $1 AND d.status = 'APPROVED'
         ORDER BY d.created_at DESC
         LIMIT 5`,
        [organizationId]
      );

      for (const draft of contentRes.rows) {
        const titleMatch = (draft.title || '').toLowerCase().includes(queryLower);
        const kwMatch = (draft.target_keyword || '').toLowerCase().includes(queryLower);
        const tokenMatch = queryTokens.some(w =>
          (draft.title || '').toLowerCase().includes(w) ||
          (draft.target_keyword || '').toLowerCase().includes(w)
        );

        if (titleMatch || kwMatch || tokenMatch) {
          items.push({
            source_type: 'APPROVED_CONTENT',
            source_id: draft.id,
            title: draft.title,
            content: draft.meta_description || draft.body_markdown.slice(0, 400),
            trust_level: 'APPROVED_CONTENT',
            relevance: 0.88,
            metadata: { content_type: draft.content_type, target_keyword: draft.target_keyword }
          });
        }
      }
    } catch (err) {
      console.warn('[AssistantRetrieval] Approved content search error:', err);
    }

    // -------------------------------------------------------------
    // TIER 3: Organization-Owned Website Pages
    // -------------------------------------------------------------
    try {
      let pageSql = `SELECT id, url, title, meta_description, path FROM pages WHERE organization_id = $1`;
      const pageParams: any[] = [organizationId];
      if (websiteId) {
        pageSql += ` AND website_id = $2`;
        pageParams.push(websiteId);
      }
      pageSql += ` LIMIT 20`;

      const pageRes = await db.query(pageSql, pageParams);
      for (const page of pageRes.rows) {
        const pageTitle = (page.title || '').toLowerCase();
        const pageDesc = (page.meta_description || '').toLowerCase();
        const pagePath = (page.path || '').toLowerCase();

        const isMatch =
          (queryLower.length > 5 && (pageTitle.includes(queryLower) || pagePath.includes(queryLower))) ||
          (queryTokens.length > 0 && queryTokens.some(t => pageTitle.includes(t) || pagePath.includes(t) || pageDesc.includes(t)));

        if (isMatch) {
          items.push({
            source_type: 'WEBSITE_PAGE',
            source_id: page.id,
            title: page.title || page.url,
            url: page.url,
            content: page.meta_description || `Page path: ${page.path}`,
            trust_level: 'ORGANIZATION_WEBSITE',
            relevance: 0.75,
            metadata: { path: page.path }
          });
        }
      }
    } catch (err) {
      console.warn('[AssistantRetrieval] Website pages search error:', err);
    }

    // -------------------------------------------------------------
    // TIER 4: Semantic Knowledge Chunks (Section & Paragraph Granularity)
    // -------------------------------------------------------------
    try {
      const chunkRes = await db.query(
        `SELECT id, section_heading, chunk_text, chunk_type, source_url
         FROM knowledge_chunks
         WHERE organization_id = $1
         LIMIT 20`,
        [organizationId]
      );
      for (const ch of chunkRes.rows) {
        const headMatch = (ch.section_heading || '').toLowerCase().includes(queryLower);
        const textMatch = queryTokens.some(t => (ch.chunk_text || '').toLowerCase().includes(t));
        if (headMatch || textMatch) {
          items.push({
            source_type: 'KNOWLEDGE_ENTITY',
            source_id: ch.id,
            title: ch.section_heading || 'Knowledge Section',
            url: ch.source_url,
            content: ch.chunk_text,
            trust_level: 'AUTHORITATIVE_KG',
            verification_status: 'VERIFIED',
            relevance: headMatch ? 0.93 : 0.82,
            metadata: { chunk_type: ch.chunk_type }
          });
        }
      }
    } catch (err) {
      // Chunk search optional
    }

    // -------------------------------------------------------------
    // TIER 5: Smart Runtime Web Research Gatekeeper
    // -------------------------------------------------------------
    const isFreshnessRequested =
      queryLower.includes('recently') ||
      queryLower.includes('latest') ||
      queryLower.includes('this month') ||
      queryLower.includes('recent news') ||
      queryLower.includes('current update');

    let externalEvidenceCount = 0;
    if (includeResearch || isFreshnessRequested) {
      try {
        const searchResults = await ResearchService.performRuntimeWebSearch(
          organizationId,
          `Webkorps ${query}`,
          3
        );
        for (const src of searchResults) {
          externalEvidenceCount++;
          const trustMap: Record<string, any> = {
            OFFICIAL_WEBKORPS: 'ORGANIZATION_WEBSITE',
            AUTHORITATIVE_EXTERNAL: 'VERIFIED_RESEARCH',
            SECONDARY: 'GENERAL_EXTERNAL',
            LOW_CONFIDENCE: 'GENERAL_EXTERNAL'
          };
          items.push({
            source_type: 'RESEARCH_EVIDENCE',
            source_id: `runtime-${Date.now()}-${externalEvidenceCount}`,
            title: src.title,
            url: src.url,
            content: src.snippet,
            trust_level: trustMap[src.trustTier] || 'VERIFIED_RESEARCH',
            relevance: isFreshnessRequested ? 0.95 : src.relevance,
            metadata: { domain: src.domain, trust_tier: src.trustTier, is_runtime_research: true }
          });
        }
      } catch (err) {
        console.warn('[AssistantRetrieval] Runtime web search error:', err);
      }
    }

    // -------------------------------------------------------------
    // Multi-Factor Deterministic Re-Ranking
    // -------------------------------------------------------------
    const trustOrder: Record<string, number> = {
      AUTHORITATIVE_KG: 1,
      APPROVED_CONTENT: 2,
      ORGANIZATION_WEBSITE: 3,
      VERIFIED_RESEARCH: 4,
      GENERAL_EXTERNAL: 5
    };

    items.sort((a, b) => {
      const orderA = trustOrder[a.trust_level] || 99;
      const orderB = trustOrder[b.trust_level] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return b.relevance - a.relevance;
    });

    const truncated = items.slice(0, maxItems);

    // Calculate Confidence
    let confidence: ConfidenceLevel = 'INSUFFICIENT';
    if (truncated.length > 0) {
      const highestTrust = truncated[0].trust_level;
      if (highestTrust === 'AUTHORITATIVE_KG' || highestTrust === 'APPROVED_CONTENT') {
        confidence = 'HIGH';
      } else if (highestTrust === 'ORGANIZATION_WEBSITE') {
        confidence = 'MEDIUM';
      } else {
        confidence = 'LOW';
      }
    }

    const queryExpansions = this.generateQueryExpansions(query, context);

    return {
      items: truncated,
      confidence,
      queryExpansions,
      externalEvidenceCount
    };
  }

  /**
   * Generates multi-faceted retrieval queries for comprehensive retrieval
   */
  public static generateQueryExpansions(query: string, context?: ConversationContext): string[] {
    const expansions: string[] = [query];
    const qLower = query.toLowerCase();

    if (context?.detectedIndustry) {
      expansions.push(`Webkorps ${context.detectedIndustry} solutions`);
      expansions.push(`Webkorps ${context.detectedIndustry} case study`);
    }
    if (qLower.includes('logistics')) {
      expansions.push('Webkorps logistics and supply chain services');
      expansions.push('Webkorps fleet tracking application');
      expansions.push('Webkorps Cryoport case study');
    }
    if (qLower.includes('technolog') || qLower.includes('stack')) {
      expansions.push('Webkorps technologies and frameworks');
    }
    if (qLower.includes('service') || qLower.includes('what does')) {
      expansions.push('Webkorps core engineering services capabilities');
    }

    return [...new Set(expansions)];
  }
}
