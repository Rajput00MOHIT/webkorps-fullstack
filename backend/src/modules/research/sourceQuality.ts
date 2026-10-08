export type SourceQualityTier = 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4';

export interface SourceQualityEvaluation {
  tier: SourceQualityTier;
  label: string;
  reasons: string[];
  baseScore: number;
}

export class SourceQualityClassifier {
  private static readonly TIER_1_DOMAINS = [
    'w3.org', 'ietf.org', 'iso.org', 'ieee.org', 'nist.gov',
    'webkorps.com', 'microsoft.com', 'google.com', 'apple.com',
    'aws.amazon.com', 'openai.com', 'anthropic.com'
  ];

  private static readonly TIER_2_DOMAINS = [
    'gartner.com', 'forrester.com', 'mckinsey.com', 'techcrunch.com',
    'reuters.com', 'bloomberg.com', 'forbes.com', 'wikipedia.org',
    'github.com', 'arxiv.org', 'venturebeat.com', 'wired.com',
    'zdnet.com', 'infoworld.com', 'theverge.com'
  ];

  private static readonly TIER_4_INDICATORS = [
    'quora.com', 'reddit.com', 'pinterest.com', 'ezinearticles.com',
    'answers.com', 'top10best', 'bestreviews', 'coupon'
  ];

  public static evaluate(url: string): SourceQualityEvaluation {
    const reasons: string[] = [];
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();

      // Check Tier 1: Government, Academic, Standards, Official Docs
      if (
        hostname.endsWith('.gov') ||
        hostname.includes('.gov.') ||
        hostname.endsWith('.edu') ||
        hostname.includes('.ac.') ||
        parsed.pathname.startsWith('/docs') ||
        hostname.startsWith('docs.') ||
        hostname.startsWith('developer.') ||
        this.TIER_1_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))
      ) {
        reasons.push('Matches authoritative standards, official company docs, government, or educational domain.');
        return {
          tier: 'TIER_1',
          label: 'PRIMARY / AUTHORITATIVE',
          reasons,
          baseScore: 1.0
        };
      }

      // Check Tier 2: Established tech journals, peer review, industry publications
      if (this.TIER_2_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))) {
        reasons.push('Recognized high-reputation publisher or research organization.');
        return {
          tier: 'TIER_2',
          label: 'HIGH_QUALITY_SECONDARY',
          reasons,
          baseScore: 0.8
        };
      }

      // Check Tier 4: Scraped, forum, or low-reputation aggregator
      if (this.TIER_4_INDICATORS.some(ind => hostname.includes(ind))) {
        reasons.push('User-generated discussion or affiliate aggregator domain.');
        return {
          tier: 'TIER_4',
          label: 'LOW_CONFIDENCE / DISCOVERY',
          reasons,
          baseScore: 0.4
        };
      }

      // Default Tier 3: General secondary
      reasons.push('General web publication or corporate domain.');
      return {
        tier: 'TIER_3',
        label: 'GENERAL_SECONDARY',
        reasons,
        baseScore: 0.6
      };
    } catch {
      return {
        tier: 'TIER_4',
        label: 'LOW_CONFIDENCE / DISCOVERY',
        reasons: ['Malformed or unverifiable URL.'],
        baseScore: 0.2
      };
    }
  }
}
