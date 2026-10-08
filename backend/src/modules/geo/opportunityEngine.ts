import type { OpportunityType, OpportunityPriority, GEOOpportunity } from './geoTypes.js';

export interface OpportunityCandidate {
  opportunityType: OpportunityType;
  title: string;
  description: string;
  evidence?: string;
  relatedQuery?: string;
  relatedUrl?: string;
  competitor?: string;
  priority: OpportunityPriority;
}

export class OpportunityEngine {
  /**
   * Deterministically evaluates observation findings and identifies actionable gaps.
   */
  public static evaluateOpportunities(
    queryText: string,
    targetMentioned: boolean,
    targetRecommended: boolean,
    targetCited: boolean,
    competitorsMentioned: Array<{ competitorName: string; recommended: boolean }>,
    citations: Array<{ citedDomain: string; isTargetDomain: boolean }>
  ): OpportunityCandidate[] {
    const opps: OpportunityCandidate[] = [];

    // 1. Competitor Cited / Mentioned while Target is Absent
    if (!targetMentioned && competitorsMentioned.length > 0) {
      const topComp = competitorsMentioned[0].competitorName;
      opps.push({
        opportunityType: 'COMPETITOR_CITED',
        title: `Competitor presence advantage in '${queryText.slice(0, 60)}...'`,
        description: `Competitor ${topComp} was mentioned and recognized by AI search for query '${queryText}', while Webkorps was omitted from the response.`,
        evidence: `Query: "${queryText}". Competitors mentioned: ${competitorsMentioned.map(c => c.competitorName).join(', ')}.`,
        relatedQuery: queryText,
        competitor: topComp,
        priority: 'HIGH'
      });

      opps.push({
        opportunityType: 'CONTENT_GAP',
        title: `Content gap for query '${queryText.slice(0, 50)}'`,
        description: `Create authoritative, indexable content specifically addressing ${queryText} to establish topical authority.`,
        relatedQuery: queryText,
        priority: 'MEDIUM'
      });
    }

    // 2. Target Mentioned but NOT Cited with URL
    if (targetMentioned && !targetCited) {
      opps.push({
        opportunityType: 'MISSING_CITATION',
        title: `Unlinked entity mention for '${queryText.slice(0, 60)}'`,
        description: `Webkorps was mentioned in the AI synthesis, but no domain link was cited in the answer sources.`,
        evidence: `Target mentioned: true, owned domain cited: false.`,
        relatedQuery: queryText,
        priority: 'MEDIUM'
      });
    }

    // 3. Target Mentioned without Recommendation Signal
    if (targetMentioned && !targetRecommended) {
      opps.push({
        opportunityType: 'WEAK_EVIDENCE',
        title: `Neutral framing without recommendation signal`,
        description: `Webkorps appears in general enumeration but lacks definitive proof points (case studies, measurable outcomes, client testimonials) needed for top-tier recommendation.`,
        relatedQuery: queryText,
        priority: 'MEDIUM'
      });
    }

    // 4. Competitor Third-Party Citations
    const thirdPartyCitations = citations.filter(c => !c.isTargetDomain);
    if (thirdPartyCitations.length > 0 && !targetCited) {
      opps.push({
        opportunityType: 'AUTHORITY_GAP',
        title: `Third-party authority gap: ${thirdPartyCitations[0].citedDomain}`,
        description: `AI engine cited third-party source ${thirdPartyCitations[0].citedDomain} to substantiate findings. Establish brand presence or research citations on similar authoritative platforms.`,
        relatedQuery: queryText,
        relatedUrl: thirdPartyCitations[0].citedDomain,
        priority: 'LOW'
      });
    }

    return opps;
  }
}
