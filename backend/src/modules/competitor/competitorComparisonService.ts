import { db } from '../../db/client.js';
import { CompetitorService } from './competitorService.js';
import { CompetitorProfileService } from './competitorProfileService.js';
import { KnowledgeService } from '../knowledge/knowledgeService.js';
import type { CompetitorVisibilityComparison, CompetitorFullComparison } from './competitorTypes.js';

export class CompetitorComparisonService {
  /**
   * Compares AI Visibility between the organization and a competitor across all tracked prompts.
   */
  public static async getVisibilityComparison(
    organizationId: string,
    competitorId: string
  ): Promise<CompetitorVisibilityComparison> {
    const competitor = await CompetitorService.getCompetitorById(organizationId, competitorId);

    // 1. Fetch all prompts and associated observation runs
    const runsRes = await db.query(
      `SELECT 
          aor.id as run_id,
          vp.id as prompt_id,
          vp.prompt_text,
          aor.completed_at
       FROM ai_observation_runs aor
       JOIN visibility_prompts vp ON vp.id = aor.prompt_id
       WHERE aor.organization_id = $1 AND aor.status = 'COMPLETED'
       ORDER BY aor.completed_at DESC`,
      [organizationId]
    );

    let orgMentions = 0;
    let orgRecommendations = 0;
    let orgCitations = 0;
    let compMentions = 0;
    let compRecommendations = 0;
    let compCitations = 0;

    const promptComparisons: CompetitorVisibilityComparison['prompts'] = [];

    for (const run of runsRes.rows) {
      // Check org mentions in this run
      const orgMentionRes = await db.query(
        `SELECT mentioned, recommendation_signal FROM ai_mentions WHERE observation_run_id = $1`,
        [run.run_id]
      );
      const isOrgMentioned = orgMentionRes.rows.some(r => r.mentioned);
      const isOrgRec = orgMentionRes.rows.some(r => r.recommendation_signal === true);

      // Check org citations in this run
      const orgCiteRes = await db.query(
        `SELECT is_target_domain FROM ai_citations WHERE observation_run_id = $1 AND is_target_domain = true`,
        [run.run_id]
      );
      const isOrgCited = orgCiteRes.rows.length > 0;

      // Check competitor mentions in this run
      const compMentionRes = await db.query(
        `SELECT mentioned, recommendation_signal, position 
         FROM ai_competitor_mentions 
         WHERE observation_run_id = $1 
           AND (competitor_name ILIKE $2 OR competitor_name ILIKE $3)`,
        [run.run_id, `%${competitor.name}%`, `%${competitor.domain}%`]
      );
      const isCompMentioned = compMentionRes.rows.some(r => r.mentioned);
      const isCompRec = compMentionRes.rows.some(r => r.recommendation_signal === true);
      const observedPos = compMentionRes.rows[0]?.position;

      // Check competitor citations in this run
      const compCiteRes = await db.query(
        `SELECT id FROM ai_citations WHERE observation_run_id = $1 AND cited_domain ILIKE $2`,
        [run.run_id, `%${competitor.domain}%`]
      );
      const isCompCited = compCiteRes.rows.length > 0;

      if (isOrgMentioned) orgMentions++;
      if (isOrgRec) orgRecommendations++;
      if (isOrgCited) orgCitations++;

      if (isCompMentioned) compMentions++;
      if (isCompRec) compRecommendations++;
      if (isCompCited) compCitations++;

      promptComparisons.push({
        promptId: run.prompt_id,
        promptText: run.prompt_text,
        targetMentioned: isOrgMentioned,
        targetRecommended: isOrgRec,
        targetCited: isOrgCited,
        competitorMentioned: isCompMentioned,
        competitorRecommended: isCompRec,
        observedPosition: observedPos
      });
    }

    return {
      competitorId: competitor.id,
      competitorName: competitor.name,
      competitorDomain: competitor.domain,
      organizationMentions: orgMentions,
      organizationRecommendations: orgRecommendations,
      organizationCitations: orgCitations,
      competitorMentions: compMentions,
      competitorRecommendations: compRecommendations,
      competitorCitations: compCitations,
      prompts: promptComparisons
    };
  }

  /**
   * Generates a comprehensive comparison covering Services, Technical SEO, and AI Visibility.
   */
  public static async getFullComparison(
    organizationId: string,
    competitorId: string
  ): Promise<CompetitorFullComparison> {
    const competitor = await CompetitorService.getCompetitorById(organizationId, competitorId);
    const profile = await CompetitorProfileService.getProfile(organizationId, competitorId);
    const visibility = await this.getVisibilityComparison(organizationId, competitorId);

    // 1. Organization Services from Knowledge Graph
    const orgEntities = await KnowledgeService.getEntities(organizationId, 'SERVICE');
    const orgServices = orgEntities.map(e => e.name);

    // 2. Competitor Services from Profile
    const compServices = profile.services_detected;
    const sharedServices = orgServices.filter(s =>
      compServices.some(cs => cs.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(cs.toLowerCase()))
    );
    const compAdvantage = compServices.filter(cs =>
      !orgServices.some(s => s.toLowerCase().includes(cs.toLowerCase()) || cs.toLowerCase().includes(s.toLowerCase()))
    );

    // 3. Technical SEO comparison
    const orgPagesRes = await db.query(
      `SELECT COUNT(*) as count FROM pages cp
       JOIN websites w ON w.id = cp.website_id
       WHERE w.organization_id = $1 AND w.is_primary = true`,
      [organizationId]
    );
    const orgPages = parseInt(orgPagesRes.rows[0]?.count || '0', 10);

    const orgSeoIssuesRes = await db.query(
      `SELECT COUNT(*) as count FROM seo_issues si
       JOIN websites w ON w.id = si.website_id
       WHERE w.organization_id = $1 AND si.status = 'OPEN'`,
      [organizationId]
    );
    const orgIssues = parseInt(orgSeoIssuesRes.rows[0]?.count || '0', 10);

    // 4. Rate calculations
    const totalPrompts = Math.max(1, visibility.prompts.length);
    const orgMentionRate = Number((visibility.organizationMentions / totalPrompts).toFixed(2));
    const compMentionRate = Number((visibility.competitorMentions / totalPrompts).toFixed(2));
    const orgRecRate = Number((visibility.organizationRecommendations / totalPrompts).toFixed(2));
    const compRecRate = Number((visibility.competitorRecommendations / totalPrompts).toFixed(2));
    const orgCiteRate = Number((visibility.organizationCitations / totalPrompts).toFixed(2));
    const compCiteRate = Number((visibility.competitorCitations / totalPrompts).toFixed(2));

    // 5. Gaps Identified
    const gaps: string[] = [];
    if (compMentionRate > orgMentionRate) {
      gaps.push(`Competitor mention rate (${(compMentionRate * 100).toFixed(0)}%) surpasses organization (${(orgMentionRate * 100).toFixed(0)}%) in target queries.`);
    }
    if (compRecRate > orgRecRate) {
      gaps.push(`Competitor receives higher recommendation rate (${(compRecRate * 100).toFixed(0)}%) across AI answers.`);
    }
    if (compCiteRate > orgCiteRate) {
      gaps.push(`Competitor website is cited more frequently (${(compCiteRate * 100).toFixed(0)}%) than target domain.`);
    }
    for (const adv of compAdvantage) {
      gaps.push(`Service coverage gap: Competitor specializes in '${adv}' which lacks dedicated representation in organization knowledge.`);
    }

    return {
      competitorId: competitor.id,
      competitorName: competitor.name,
      competitorDomain: competitor.domain,
      serviceComparison: {
        organizationServices: orgServices,
        competitorServices: compServices,
        sharedServices,
        competitorAdvantageServices: compAdvantage
      },
      seoComparison: {
        organizationPages: orgPages,
        competitorPages: profile.pages_crawled,
        organizationSeoIssues: orgIssues,
        competitorSeoIssues: profile.seo_weaknesses.length
      },
      aiVisibilityComparison: {
        organizationMentionRate: orgMentionRate,
        competitorMentionRate: compMentionRate,
        organizationRecommendationRate: orgRecRate,
        competitorRecommendationRate: compRecRate,
        organizationCitationRate: orgCiteRate,
        competitorCitationRate: compCiteRate
      },
      gapsIdentified: gaps
    };
  }
}
