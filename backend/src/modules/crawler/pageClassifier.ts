export type PageType =
  | 'HOME'
  | 'ABOUT'
  | 'SERVICE'
  | 'SUBSERVICE'
  | 'TECHNOLOGY'
  | 'INDUSTRY'
  | 'CASE_STUDY'
  | 'BLOG'
  | 'INSIGHT'
  | 'EVENT'
  | 'FAQ'
  | 'CONTACT'
  | 'LOCATION'
  | 'CAREER'
  | 'PRODUCT'
  | 'SOLUTION'
  | 'LEGAL'
  | 'OTHER';

export interface PageClassificationResult {
  pageType: PageType;
  confidence: number;
  method: 'DETERMINISTIC_URL' | 'HEADING_SIGNAL' | 'CONTENT_HEURISTIC';
  matchedKeywords: string[];
}

export class PageClassifier {
  /**
   * Deterministically classifies a URL, title, and headings into structured page types.
   */
  public static classify(
    url: string,
    title: string = '',
    headings: { h1: string[]; h2: string[] } = { h1: [], h2: [] },
    cleanText: string = ''
  ): PageClassificationResult {
    const rawUrl = (url || '').toLowerCase();
    const pathname = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`).pathname.toLowerCase();
    const lowerTitle = (title || '').toLowerCase();
    const allHeadings = [...(headings.h1 || []), ...(headings.h2 || [])].map(h => h.toLowerCase());

    // 1. HOME
    if (pathname === '/' || pathname === '' || pathname === '/home' || pathname === '/index.html') {
      return { pageType: 'HOME', confidence: 1.0, method: 'DETERMINISTIC_URL', matchedKeywords: ['/'] };
    }

    // 2. CONTACT / LOCATIONS
    if (pathname.includes('/contact') || pathname.includes('/get-in-touch') || pathname.includes('/reach-us')) {
      return { pageType: 'CONTACT', confidence: 1.0, method: 'DETERMINISTIC_URL', matchedKeywords: ['contact'] };
    }
    if (pathname.includes('/location') || pathname.includes('/offices') || pathname.includes('/branches')) {
      return { pageType: 'LOCATION', confidence: 0.95, method: 'DETERMINISTIC_URL', matchedKeywords: ['locations'] };
    }

    // 3. CASE STUDIES / PORTFOLIO / WORK
    if (
      pathname.includes('/case-stud') ||
      pathname.includes('/work') ||
      pathname.includes('/portfolio') ||
      pathname.includes('/client-stories') ||
      pathname.includes('/success-stories')
    ) {
      return { pageType: 'CASE_STUDY', confidence: 1.0, method: 'DETERMINISTIC_URL', matchedKeywords: ['case-study'] };
    }

    // 4. CAREERS
    if (pathname.includes('/career') || pathname.includes('/jobs') || pathname.includes('/join-us') || pathname.includes('/hiring')) {
      return { pageType: 'CAREER', confidence: 1.0, method: 'DETERMINISTIC_URL', matchedKeywords: ['career'] };
    }

    // 5. ABOUT / LEADERSHIP / COMPANY
    if (
      pathname.includes('/about') ||
      pathname.includes('/company') ||
      pathname.includes('/leadership') ||
      pathname.includes('/team') ||
      pathname.includes('/who-we-are')
    ) {
      return { pageType: 'ABOUT', confidence: 1.0, method: 'DETERMINISTIC_URL', matchedKeywords: ['about'] };
    }

    // 6. FAQ
    if (pathname.includes('/faq') || lowerTitle.includes('frequently asked questions') || allHeadings.some(h => h.includes('faq') || h.includes('frequently asked'))) {
      return { pageType: 'FAQ', confidence: 0.95, method: 'DETERMINISTIC_URL', matchedKeywords: ['faq'] };
    }

    // 7. BLOGS / INSIGHTS / EVENTS
    if (pathname.includes('/blog') || pathname.includes('/article')) {
      return { pageType: 'BLOG', confidence: 1.0, method: 'DETERMINISTIC_URL', matchedKeywords: ['blog'] };
    }
    if (pathname.includes('/insight') || pathname.includes('/resources') || pathname.includes('/whitepaper')) {
      return { pageType: 'INSIGHT', confidence: 0.9, method: 'DETERMINISTIC_URL', matchedKeywords: ['insight'] };
    }
    if (pathname.includes('/event') || pathname.includes('/webinar')) {
      return { pageType: 'EVENT', confidence: 0.95, method: 'DETERMINISTIC_URL', matchedKeywords: ['event'] };
    }

    // 8. LEGAL / PRIVACY / TERMS
    if (pathname.includes('/privacy') || pathname.includes('/terms') || pathname.includes('/disclaimer') || pathname.includes('/gdpr') || pathname.includes('/security-policy')) {
      return { pageType: 'LEGAL', confidence: 1.0, method: 'DETERMINISTIC_URL', matchedKeywords: ['legal'] };
    }

    // 9. INDUSTRIES
    const industryKeywords = ['industr', 'logistics', 'healthcare', 'healthtech', 'fintech', 'retail', 'ecommerce', 'e-commerce', 'education', 'edtech', 'real-estate', 'proptech', 'manufacturing', 'travel', 'hospitality'];
    if (pathname.includes('/industr') || industryKeywords.some(ik => pathname.includes(`/${ik}`))) {
      return { pageType: 'INDUSTRY', confidence: 0.95, method: 'DETERMINISTIC_URL', matchedKeywords: ['industry'] };
    }

    // 10. TECHNOLOGIES
    const techKeywords = ['technolog', 'flutter', 'react', 'react-native', 'node', 'python', 'golang', 'java', 'ruby-on-rails', 'dotnet', 'php', 'android', 'ios', 'aws', 'cloud', 'devops', 'ai-ml', 'blockchain'];
    if (pathname.includes('/technolog') || techKeywords.some(tk => pathname.includes(`/${tk}`))) {
      return { pageType: 'TECHNOLOGY', confidence: 0.95, method: 'DETERMINISTIC_URL', matchedKeywords: ['technology'] };
    }

    // 11. SERVICES & SUBSERVICES
    if (pathname.includes('/service') || pathname.includes('/solution') || pathname.includes('/capabilities')) {
      const parts = pathname.split('/').filter(p => p.length > 0);
      if (parts.length > 2) {
        return { pageType: 'SUBSERVICE', confidence: 0.9, method: 'DETERMINISTIC_URL', matchedKeywords: ['subservice'] };
      }
      return { pageType: 'SERVICE', confidence: 0.95, method: 'DETERMINISTIC_URL', matchedKeywords: ['service'] };
    }

    // 12. HEADING & CONTENT SIGNALS (FALLBACK)
    if (allHeadings.some(h => h.includes('case study') || h.includes('client story'))) {
      return { pageType: 'CASE_STUDY', confidence: 0.8, method: 'HEADING_SIGNAL', matchedKeywords: ['heading:case_study'] };
    }
    if (allHeadings.some(h => h.includes('services we offer') || h.includes('our services') || h.includes('engineering capabilities'))) {
      return { pageType: 'SERVICE', confidence: 0.8, method: 'HEADING_SIGNAL', matchedKeywords: ['heading:services'] };
    }
    if (allHeadings.some(h => h.includes('industries we serve') || h.includes('industry solutions'))) {
      return { pageType: 'INDUSTRY', confidence: 0.8, method: 'HEADING_SIGNAL', matchedKeywords: ['heading:industry'] };
    }
    if (allHeadings.some(h => h.includes('technologies we use') || h.includes('our tech stack'))) {
      return { pageType: 'TECHNOLOGY', confidence: 0.8, method: 'HEADING_SIGNAL', matchedKeywords: ['heading:tech_stack'] };
    }

    return {
      pageType: 'OTHER',
      confidence: 0.5,
      method: 'CONTENT_HEURISTIC',
      matchedKeywords: []
    };
  }
}
