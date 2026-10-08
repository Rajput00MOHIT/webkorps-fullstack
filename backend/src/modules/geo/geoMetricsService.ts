import { db } from '../../db/client.js';
import type { GEOSummaryMetrics } from './geoTypes.js';

export class GEOMetricsService {
  /**
   * Computes empirical GEO visibility metrics for a tenant.
   * Does NOT generate a fake "GEO Score" — computes verifiable observations.
   */
  public static async calculateSummary(organizationId: string): Promise<GEOSummaryMetrics> {
    // 1. Total completed observations
    const runsRes = await db.query(
      `SELECT count(*) as total FROM ai_observation_runs
       WHERE organization_id = $1 AND status = 'COMPLETED'`,
      [organizationId]
    );
    const totalRuns = parseInt(runsRes.rows[0].total, 10) || 0;

    if (totalRuns === 0) {
      return {
        observations: 0,
        mentionRate: 0.0,
        recommendationRate: 0.0,
        citationRate: 0.0,
        ownedCitationRate: 0.0,
        competitorMentionRate: 0.0,
        promptCoverage: 0.0,
        trend: {
          previousPeriodMentionRate: 0.0,
          currentPeriodMentionRate: 0.0
        }
      };
    }

    // 2. Mentions & Recommendations
    const mentionsRes = await db.query(
      `SELECT 
         count(*) FILTER (WHERE mentioned = TRUE) as mentioned_count,
         count(*) FILTER (WHERE recommendation_signal = TRUE) as recommended_count
       FROM ai_mentions
       WHERE organization_id = $1`,
      [organizationId]
    );
    const mentionedCount = parseInt(mentionsRes.rows[0].mentioned_count, 10) || 0;
    const recommendedCount = parseInt(mentionsRes.rows[0].recommended_count, 10) || 0;

    // 3. Citations & Owned Citations
    const citationsRes = await db.query(
      `SELECT 
         count(DISTINCT observation_run_id) as total_cited_runs,
         count(DISTINCT observation_run_id) FILTER (WHERE is_target_domain = TRUE) as owned_cited_runs
       FROM ai_citations
       WHERE organization_id = $1`,
      [organizationId]
    );
    const totalCitedRuns = parseInt(citationsRes.rows[0].total_cited_runs, 10) || 0;
    const ownedCitedRuns = parseInt(citationsRes.rows[0].owned_cited_runs, 10) || 0;

    // 4. Competitor Mentions
    const compRes = await db.query(
      `SELECT count(DISTINCT observation_run_id) as comp_runs
       FROM ai_competitor_mentions
       WHERE organization_id = $1 AND mentioned = TRUE`,
      [organizationId]
    );
    const compRuns = parseInt(compRes.rows[0].comp_runs, 10) || 0;

    // 5. Prompt Coverage across Categories
    const catRes = await db.query(
      `SELECT count(DISTINCT category) as active_cats
       FROM visibility_prompts
       WHERE organization_id = $1 AND active = TRUE`,
      [organizationId]
    );
    const activeCats = parseInt(catRes.rows[0].active_cats, 10) || 0;
    const promptCoverage = Number(Math.min(1.0, activeCats / 7).toFixed(2));

    // 6. Trend: Last 7 days vs Previous 7 days
    const currentPeriodRes = await db.query(
      `SELECT count(*) FILTER (WHERE m.mentioned = TRUE) as m_curr, count(*) as total_curr
       FROM ai_observation_runs r
       LEFT JOIN ai_mentions m ON r.id = m.observation_run_id
       WHERE r.organization_id = $1 AND r.status = 'COMPLETED'
         AND r.created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'`,
      [organizationId]
    );
    const mCurr = parseInt(currentPeriodRes.rows[0].m_curr, 10) || 0;
    const totalCurr = parseInt(currentPeriodRes.rows[0].total_curr, 10) || 0;
    const currRate = totalCurr > 0 ? Number((mCurr / totalCurr).toFixed(2)) : Number((mentionedCount / totalRuns).toFixed(2));

    const prevPeriodRes = await db.query(
      `SELECT count(*) FILTER (WHERE m.mentioned = TRUE) as m_prev, count(*) as total_prev
       FROM ai_observation_runs r
       LEFT JOIN ai_mentions m ON r.id = m.observation_run_id
       WHERE r.organization_id = $1 AND r.status = 'COMPLETED'
         AND r.created_at < CURRENT_TIMESTAMP - INTERVAL '7 days'
         AND r.created_at >= CURRENT_TIMESTAMP - INTERVAL '14 days'`,
      [organizationId]
    );
    const mPrev = parseInt(prevPeriodRes.rows[0].m_prev, 10) || 0;
    const totalPrev = parseInt(prevPeriodRes.rows[0].total_prev, 10) || 0;
    const prevRate = totalPrev > 0 ? Number((mPrev / totalPrev).toFixed(2)) : currRate;

    return {
      observations: totalRuns,
      mentionRate: Number((mentionedCount / totalRuns).toFixed(2)),
      recommendationRate: Number((recommendedCount / totalRuns).toFixed(2)),
      citationRate: Number((totalCitedRuns / totalRuns).toFixed(2)),
      ownedCitationRate: Number((ownedCitedRuns / totalRuns).toFixed(2)),
      competitorMentionRate: Number((compRuns / totalRuns).toFixed(2)),
      promptCoverage,
      trend: {
        previousPeriodMentionRate: prevRate,
        currentPeriodMentionRate: currRate
      }
    };
  }
}
