import type { RetrievalItem } from '../assistantTypes.js';

export type SourceRelevance = 'DIRECTLY_RELEVANT' | 'INDIRECTLY_RELEVANT' | 'CONTEXT_ONLY' | 'IRRELEVANT';
export type EvidenceCategory = 'COMPANY_FACT' | 'CASE_STUDY' | 'SERVICE' | 'TECHNOLOGY' | 'LEADERSHIP' | 'GENERAL_RESEARCH' | 'INDUSTRY_STANDARD';

export interface ExtractedClaim {
  id: string;
  sourceId: string;
  sourceUrl: string;
  sourceType: string;
  citationTag: string; // e.g. "[S1]"
  category: EvidenceCategory;
  relevance: SourceRelevance;
  entityName: string;
  industry?: string;
  claimText: string;
  details: {
    client?: string;
    challenge?: string;
    solution?: string;
    technologies?: string[];
    features?: string[];
    roleOrTitle?: string;
    outcomes?: string;
  };
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface FormattedEvidencePack {
  formattedText: string;
  items: Array<{
    citationTag: string; // e.g. "[S1]"
    item: RetrievalItem;
    relevance: SourceRelevance;
    claims: ExtractedClaim[];
  }>;
  extractedClaims: ExtractedClaim[];
  directlyRelevantClaims: ExtractedClaim[];
  verifiedCaseStudies: ExtractedClaim[];
  verifiedServices: ExtractedClaim[];
  verifiedLeaders: ExtractedClaim[];
  hasSufficientEvidence: boolean;
  isPartial: boolean;
  citationMap: Record<string, string>;
}

export class EvidencePackBuilder {
  /**
   * Deduplicates, orders, extracts atomic claims, and formats retrieved items into a structured Evidence Pack.
   */
  public static build(items: RetrievalItem[]): FormattedEvidencePack {
    if (!items || items.length === 0) {
      return {
        formattedText: 'No verified evidence items found in company records.',
        items: [],
        extractedClaims: [],
        directlyRelevantClaims: [],
        verifiedCaseStudies: [],
        verifiedServices: [],
        verifiedLeaders: [],
        hasSufficientEvidence: false,
        isPartial: false,
        citationMap: {}
      };
    }

    // 1. Deduplicate by entity title and normalized content snippet
    const seen = new Set<string>();
    const deduped: RetrievalItem[] = [];

    for (const it of items) {
      const normalizedTitle = (it.title || '').trim().toLowerCase();
      const contentSnippet = (it.content || '').slice(0, 60).toLowerCase();
      const key = `${normalizedTitle}-${contentSnippet}`;
      if (!seen.has(key) && normalizedTitle) {
        seen.add(key);
        deduped.push(it);
      }
    }

    // 2. Order items: Sort by relevance
    const sorted = [...deduped].sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
    const topItems = sorted.slice(0, 8);

    // 3. Extract atomic claims & classify relevance
    const allClaims: ExtractedClaim[] = [];
    const formattedList: FormattedEvidencePack['items'] = [];
    const textBlocks: string[] = [];
    const citationMap: Record<string, string> = {};

    topItems.forEach((item, idx) => {
      const tag = `[S${idx + 1}]`;
      const entityType = item.metadata?.entity_type || item.source_type || 'SOURCE';
      const url = item.url || '#';
      const relevanceScore = item.relevance || 0;

      // Classify relevance tier
      let relevance: SourceRelevance = 'INDIRECTLY_RELEVANT';
      if (relevanceScore >= 0.75) {
        relevance = 'DIRECTLY_RELEVANT';
      } else if (relevanceScore >= 0.45) {
        relevance = 'INDIRECTLY_RELEVANT';
      } else if (relevanceScore >= 0.2) {
        relevance = 'CONTEXT_ONLY';
      } else {
        relevance = 'IRRELEVANT';
      }

      // Extract atomic structured claims
      const claims = this.extractClaimsFromItem(item, tag, relevance);
      allClaims.push(...claims);

      // Render readable prose
      const cleanContent = this.formatContentToProse(item);
      const header = `${tag} | ${entityType} | ${item.title} | ${url}`;
      textBlocks.push(`${header}\n${cleanContent}`);

      formattedList.push({
        citationTag: tag,
        item,
        relevance,
        claims
      });
      citationMap[tag] = item.title;
    });

    const directlyRelevant = allClaims.filter(c => c.relevance === 'DIRECTLY_RELEVANT');
    const caseStudies = allClaims.filter(c => c.category === 'CASE_STUDY');
    const services = allClaims.filter(c => c.category === 'SERVICE');
    const leaders = allClaims.filter(c => c.category === 'LEADERSHIP');

    const hasSufficientEvidence = topItems.length > 0 && (topItems[0].relevance || 0) >= 0.4;
    const isPartial = topItems.length > 0 && (topItems[0].relevance || 0) < 0.7;

    return {
      formattedText: textBlocks.join('\n\n---\n\n'),
      items: formattedList,
      extractedClaims: allClaims,
      directlyRelevantClaims: directlyRelevant,
      verifiedCaseStudies: caseStudies,
      verifiedServices: services,
      verifiedLeaders: leaders,
      hasSufficientEvidence,
      isPartial,
      citationMap
    };
  }

  /**
   * Extracts atomic, verifiable claims from a single retrieval item
   */
  public static extractClaimsFromItem(
    item: RetrievalItem,
    citationTag: string,
    relevance: SourceRelevance
  ): ExtractedClaim[] {
    const claims: ExtractedClaim[] = [];
    const sourceId = item.source_id || (item as any).id || `src-${Math.random()}`;
    const sourceUrl = item.url || '#';
    const sourceType = item.source_type || 'KNOWLEDGE_ENTITY';
    const title = item.title || '';
    const attrs = item.metadata?.attributes || item.metadata || {};
    const content = item.content || '';

    // 1. Case Study Claims (e.g. Cryoport, PayPal, Sonic Healthcare)
    if (
      attrs.client ||
      item.metadata?.entity_type === 'CASE_STUDY' ||
      item.metadata?.entity_type === 'CLIENT' ||
      /case study|worked on|developed for/i.test(content) ||
      ['Cryoport', 'PayPal', 'Sonic Healthcare', 'Medhost', 'ACIMA', 'Verizon', 'ABB'].some(c => title.toLowerCase().includes(c.toLowerCase()))
    ) {
      const clientName = attrs.client || title.replace(/\s*case study/i, '').trim();
      const industry = attrs.industry || (/logistic|supply chain|cold-chain/i.test(content) ? 'Logistics & Supply Chain' : (/health|hospital/i.test(content) ? 'Healthcare' : 'Enterprise'));
      const solution = attrs.solution || (attrs.description ? attrs.description : content.slice(0, 200));
      const technologies = Array.isArray(attrs.technologies) ? attrs.technologies : [];

      claims.push({
        id: `claim-${sourceId}-cs`,
        sourceId,
        sourceUrl,
        sourceType,
        citationTag,
        category: 'CASE_STUDY',
        relevance,
        entityName: clientName,
        industry,
        claimText: `Webkorps engineered a digital solution for ${clientName} in ${industry}. Solution: ${solution}`,
        details: {
          client: clientName,
          challenge: attrs.businessProblem || attrs.challenge,
          solution,
          technologies,
          features: Array.isArray(attrs.features) ? attrs.features : []
        },
        confidence: 'HIGH'
      });
    }

    // 2. Service Capabilities Claims
    if (item.metadata?.entity_type === 'SERVICE' || /service|development|engineering/i.test(title)) {
      const serviceName = title;
      const technologies = Array.isArray(attrs.technologies) ? attrs.technologies : [];
      claims.push({
        id: `claim-${sourceId}-svc`,
        sourceId,
        sourceUrl,
        sourceType,
        citationTag,
        category: 'SERVICE',
        relevance,
        entityName: serviceName,
        claimText: `Webkorps delivers full-lifecycle engineering for ${serviceName}.`,
        details: {
          solution: attrs.description || content.slice(0, 180),
          technologies
        },
        confidence: 'HIGH'
      });
    }

    // 3. Leadership & Executive Claims
    if (item.metadata?.entity_type === 'LEADER' || /chirag agrawal|amul choudhary|ceo|coo/i.test(title)) {
      claims.push({
        id: `claim-${sourceId}-ldr`,
        sourceId,
        sourceUrl,
        sourceType,
        citationTag,
        category: 'LEADERSHIP',
        relevance,
        entityName: title,
        claimText: `${title} is a key executive leader at Webkorps.`,
        details: {
          roleOrTitle: attrs.role || attrs.title || title
        },
        confidence: 'HIGH'
      });
    }

    // 4. Default Company Fact or General Research
    if (claims.length === 0) {
      claims.push({
        id: `claim-${sourceId}-gen`,
        sourceId,
        sourceUrl,
        sourceType,
        citationTag,
        category: sourceType === 'KNOWLEDGE_ENTITY' ? 'COMPANY_FACT' : 'GENERAL_RESEARCH',
        relevance,
        entityName: title,
        claimText: content.slice(0, 200),
        details: {},
        confidence: relevance === 'DIRECTLY_RELEVANT' ? 'HIGH' : 'MEDIUM'
      });
    }

    return claims;
  }

  /**
   * Formats chunk text or entity attributes into clean, natural prose blocks.
   */
  public static formatContentToProse(item: RetrievalItem): string {
    let raw = item.content || '';

    // Strip raw entity tags
    raw = raw.replace(/^\[[A-Z_]+\]\s*[^:]+:\s*/, '');

    if (raw.startsWith('{') && raw.endsWith('}')) {
      try {
        const obj = JSON.parse(raw);
        return this.renderAttributesToProse(item.title, item.metadata?.entity_type, obj);
      } catch {
        // Not valid JSON
      }
    }

    if (item.metadata?.attributes && typeof item.metadata.attributes === 'object') {
      return this.renderAttributesToProse(item.title, item.metadata.entity_type, item.metadata.attributes);
    }

    const cleaned = raw
      .replace(/[\{\}\[\]"]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned || this.renderAttributesToProse(item.title, item.metadata?.entity_type, {});
  }

  private static renderAttributesToProse(title: string, entityType?: string, attrs: any = {}): string {
    const parts: string[] = [];

    if (attrs.overview) parts.push(attrs.overview);
    if (attrs.description) parts.push(attrs.description);
    if (attrs.webkorpsCapabilities) parts.push(attrs.webkorpsCapabilities);
    if (attrs.client) parts.push(`Client: ${attrs.client}.`);
    if (attrs.industry) parts.push(`Industry: ${attrs.industry}.`);
    if (attrs.businessProblem) parts.push(`Challenge: ${attrs.businessProblem}`);
    if (attrs.solution) parts.push(`Solution: ${attrs.solution}`);
    if (Array.isArray(attrs.technologies)) parts.push(`Technologies: ${attrs.technologies.join(', ')}.`);
    if (attrs.outcomes) parts.push(`Outcomes: ${attrs.outcomes}`);
    if (Array.isArray(attrs.features)) parts.push(`Key Features: ${attrs.features.join(', ')}.`);
    if (Array.isArray(attrs.relevantFeatures)) parts.push(`Key Capabilities: ${attrs.relevantFeatures.join(', ')}.`);
    if (Array.isArray(attrs.commonApps)) parts.push(`Core Applications: ${attrs.commonApps.join(', ')}.`);
    if (Array.isArray(attrs.recommendedStack)) parts.push(`Recommended Stack: ${attrs.recommendedStack.join(', ')}.`);
    if (attrs.headquarters) parts.push(`Headquarters: ${attrs.headquarters}.`);
    if (attrs.totalEngineers) parts.push(`Team Size: ${attrs.totalEngineers}.`);
    if (attrs.experienceYears) parts.push(`Experience: ${attrs.experienceYears}.`);

    if (parts.length === 0) {
      if (entityType === 'LEADER') return `${title} is a core executive and technology leader at Webkorps.`;
      if (entityType === 'OFFICE') return `Webkorps maintains a global development office in ${title.replace(/Office\s*/i, '')}.`;
      if (entityType === 'CERTIFICATION') return `Webkorps holds the ${title} international quality certification.`;
      if (entityType === 'SERVICE') return `Webkorps provides full-lifecycle engineering services for ${title}.`;
      if (entityType === 'TECHNOLOGY') return `Webkorps builds production platforms utilizing ${title}.`;
      if (entityType === 'INDUSTRY') return `Webkorps delivers custom enterprise software solutions for the ${title} industry.`;
      return `${title} represents verified Webkorps engineering capability.`;
    }

    return parts.join(' ').trim();
  }
}
