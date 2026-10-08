export interface QueryAnalysis {
  rawQuery: string;
  normalizedQuery: string;
  needsFreshInfo: boolean;
  intent: 'INTERNAL_KNOWLEDGE' | 'EXTERNAL_RESEARCH' | 'TEMPORAL_UPDATE' | 'COMPETITIVE_ANALYSIS' | 'GENERAL';
  searchQuery: string;
  entities: string[];
  reasons: string[];
}

export class QueryUnderstanding {
  private static readonly TEMPORAL_INDICATORS = [
    'latest', 'recent', 'today', 'now', 'current', 'news', 'update', 'updates',
    'this week', 'this month', 'this year', '2025', '2026', 'new release', 'trend', 'trends'
  ];

  private static readonly RESEARCH_INDICATORS = [
    'search the web', 'google', 'look up', 'find online', 'market size', 'benchmark',
    'competitor', 'competitors', 'compare with', 'pricing for', 'industry average',
    'statistics', 'report', 'case studies in market', 'what is happening'
  ];

  private static readonly INTERNAL_GROUND_TRUTH_INDICATORS = [
    'webkorps services', 'webkorps office', 'webkorps location', 'webkorps team',
    'webkorps leadership', 'webkorps contact', 'about webkorps', 'who founded webkorps',
    'webkorps hq', 'webkorps indore', 'webkorps certifications'
  ];

  public static analyze(query: string): QueryAnalysis {
    const rawQuery = String(query || '').trim();
    const normalized = rawQuery.toLowerCase();
    const reasons: string[] = [];

    // 1. Check for explicit internal company knowledge
    const isInternalSpecific = this.INTERNAL_GROUND_TRUTH_INDICATORS.some(ind => normalized.includes(ind));

    // 2. Check for temporal freshness cues
    const hasTemporalCues = this.TEMPORAL_INDICATORS.some(ind => {
      const regex = new RegExp(`\\b${ind}\\b`, 'i');
      return regex.test(normalized);
    });

    // 3. Check for external research indicators
    const hasResearchCues = this.RESEARCH_INDICATORS.some(ind => normalized.includes(ind));

    let needsFreshInfo = false;
    let intent: QueryAnalysis['intent'] = 'GENERAL';

    if (hasTemporalCues) {
      needsFreshInfo = true;
      intent = 'TEMPORAL_UPDATE';
      reasons.push('Contains temporal freshness indicators (e.g., latest, current, news, 2025/2026).');
    } else if (hasResearchCues) {
      needsFreshInfo = true;
      intent = normalized.includes('competitor') || normalized.includes('compare')
        ? 'COMPETITIVE_ANALYSIS'
        : 'EXTERNAL_RESEARCH';
      reasons.push('Contains external market/research indicators.');
    } else if (isInternalSpecific) {
      needsFreshInfo = false;
      intent = 'INTERNAL_KNOWLEDGE';
      reasons.push('Mapped to verified internal Webkorps ground-truth knowledge.');
    } else {
      // For general questions about external subjects not covered by company knowledge
      const isCompanyFocused = normalized.includes('webkorps') || normalized.includes('you') || normalized.includes('your');
      if (!isCompanyFocused && rawQuery.split(' ').length >= 3) {
        needsFreshInfo = true;
        intent = 'EXTERNAL_RESEARCH';
        reasons.push('Query asks about general external domain knowledge.');
      } else {
        intent = 'INTERNAL_KNOWLEDGE';
        reasons.push('Standard conversational inquiry.');
      }
    }

    // Clean search terms: remove punctuation and filter query
    const cleanedSearchQuery = rawQuery
      .replace(/[?!.,;]/g, '')
      .replace(/\b(please|can you|tell me|search the web for|what is the)\b/gi, '')
      .trim();

    return {
      rawQuery,
      normalizedQuery: normalized,
      needsFreshInfo,
      intent,
      searchQuery: cleanedSearchQuery || rawQuery,
      entities: this.extractEntities(rawQuery),
      reasons
    };
  }

  private static extractEntities(query: string): string[] {
    const words = query.split(/\s+/);
    const capitalized = words.filter(w => /^[A-Z][a-zA-Z0-9_-]+$/.test(w) && w.length > 2);
    return Array.from(new Set(capitalized));
  }
}
