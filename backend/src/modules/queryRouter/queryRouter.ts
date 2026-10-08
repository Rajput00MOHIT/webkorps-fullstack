export type ResearchRoute =
  | 'INTERNAL_KNOWLEDGE'
  | 'CRAWL_DATABASE'
  | 'WEB_RESEARCH'
  | 'HYBRID_RESEARCH';

export interface QueryRoutingDecision {
  route: ResearchRoute;
  confidence: number;
  reasons: string[];
  requiresFreshData: boolean;
  requiresExternalSources: boolean;
  requiresCompanyContext: boolean;
}

export class QueryRouter {
  // 1. Crawl database patterns (pages, crawl runs, SEO issues, site audits)
  private static readonly CRAWL_PATTERNS = [
    /\b(how many pages|pages crawled|pages found|crawled pages)\b/i,
    /\b(seo issues?|seo audit|audit issues?|broken links?)\b/i,
    /\b(thin content|duplicate title|long meta description|missing alt)\b/i,
    /\b(indexab(le|ility)|canonical issues?|orphan pages?)\b/i,
    /\b(internal links? count|external links? count|link graph)\b/i,
    /\b(crawl status|crawl run|last crawl)\b/i
  ];

  // 2. Hybrid patterns (Company + Competitor/Market/AI visibility/Why not appearing)
  private static readonly HYBRID_PATTERNS = [
    /\b(compare (webkorps|us|our company)|vs competitors?|compared to competitors?)\b/i,
    /\b(why is webkorps not appearing|why aren't we appearing|not ranking|not showing up)\b/i,
    /\b(content opportunities for webkorps|competitor analysis for webkorps)\b/i,
    /\b(webkorps.*(competitor|market share|ranking|visibility in ai|serp))\b/i,
    /\b((ai answers|ai overviews|chatgpt|search results).*webkorps)\b/i
  ];

  // 3. Temporal & external web patterns (2025, 2026, latest, current trends, news)
  private static readonly WEB_PATTERNS = [
    /\b(latest|current|trends?|news|updates?|today|now|2025|2026)\b/i,
    /\b(top \d+|best companies|market size|industry benchmarks?)\b/i,
    /\b(search the web|look up online|find on google)\b/i,
    /\b(who are the top|what is happening with)\b/i
  ];

  // 4. Internal knowledge base patterns (ground truth Webkorps facts)
  private static readonly INTERNAL_PATTERNS = [
    /\b(services?|kya hain|what do you do|what does webkorps do)\b/i,
    /\b(headquarters?|hq|office|locations?|indore|pune|bengaluru|frisco|sheridan)\b/i,
    /\b(team|leadership|founders?|ceo|directors?)\b/i,
    /\b(certifications?|cmmi|iso 27001|iso 9001)\b/i,
    /\b(about webkorps|who is webkorps|contact webkorps)\b/i
  ];

  public static route(query: string): QueryRoutingDecision {
    const raw = String(query || '').trim();
    const normalized = raw.toLowerCase();
    const reasons: string[] = [];

    const hasCompanyContext =
      normalized.includes('webkorps') ||
      normalized.includes('our company') ||
      normalized.includes('your services') ||
      normalized.includes('you do') ||
      normalized.includes('we offer');

    // Check Hybrid first
    const isHybrid = this.HYBRID_PATTERNS.some(p => p.test(normalized));
    if (isHybrid) {
      reasons.push('Query combines company context with external market, competitor comparison, or visibility search.');
      return {
        route: 'HYBRID_RESEARCH',
        confidence: 0.92,
        reasons,
        requiresFreshData: true,
        requiresExternalSources: true,
        requiresCompanyContext: true
      };
    }

    // Check Crawl Database
    const isCrawlDb = this.CRAWL_PATTERNS.some(p => p.test(normalized));
    if (isCrawlDb) {
      reasons.push('Query asks about crawled website statistics, pages, audit metrics, or SEO issues.');
      return {
        route: 'CRAWL_DATABASE',
        confidence: 0.95,
        reasons,
        requiresFreshData: false,
        requiresExternalSources: false,
        requiresCompanyContext: true
      };
    }

    // Check External Web
    const isWeb = this.WEB_PATTERNS.some(p => p.test(normalized));
    const isInternal = this.INTERNAL_PATTERNS.some(p => p.test(normalized));

    if (isWeb && !hasCompanyContext) {
      reasons.push('Query asks about fresh external market trends, industry benchmarks, or general web topics.');
      return {
        route: 'WEB_RESEARCH',
        confidence: 0.90,
        reasons,
        requiresFreshData: true,
        requiresExternalSources: true,
        requiresCompanyContext: false
      };
    }

    if (isWeb && hasCompanyContext) {
      // Questions like "What are the latest services Webkorps added in 2026?"
      reasons.push('Query asks about fresh temporal information referencing company context.');
      return {
        route: 'HYBRID_RESEARCH',
        confidence: 0.85,
        reasons,
        requiresFreshData: true,
        requiresExternalSources: true,
        requiresCompanyContext: true
      };
    }

    if (hasCompanyContext || isInternal) {
      reasons.push('Query asks about verified internal company facts, capabilities, leadership, or services.');
      return {
        route: 'INTERNAL_KNOWLEDGE',
        confidence: 0.95,
        reasons,
        requiresFreshData: false,
        requiresExternalSources: false,
        requiresCompanyContext: true
      };
    }

    // Default to Web Research if query is non-company specific (e.g. general questions)
    if (raw.split(/\s+/).length >= 3) {
      reasons.push('General informational inquiry requiring external web research.');
      return {
        route: 'WEB_RESEARCH',
        confidence: 0.75,
        reasons,
        requiresFreshData: true,
        requiresExternalSources: true,
        requiresCompanyContext: false
      };
    }

    // Conversational fallback
    reasons.push('Conversational message routed to internal company knowledge assistant.');
    return {
      route: 'INTERNAL_KNOWLEDGE',
      confidence: 0.80,
      reasons,
      requiresFreshData: false,
      requiresExternalSources: false,
      requiresCompanyContext: true
    };
  }
}
