import { db } from '../../db/client.js';
import { CompetitorService } from './competitorService.js';
import type { CompetitorProfile } from './competitorTypes.js';

export class CompetitorProfileService {
  /**
   * Aggregates empirical data across website crawl, AI visibility, and citations
   * to build an evidence-backed Competitor Profile.
   */
  public static async getProfile(organizationId: string, competitorId: string): Promise<CompetitorProfile> {
    const competitor = await CompetitorService.getCompetitorById(organizationId, competitorId);

    // 1. Crawl Data for competitor domain
    const websiteRes = await db.query(
      `SELECT id FROM websites WHERE organization_id = $1 AND domain = $2 LIMIT 1`,
      [organizationId, competitor.domain]
    );

    let pagesCrawled = 0;
    const servicesDetected = new Set<string>(competitor.core_capabilities || []);
    const topicsDetected = new Set<string>();
    const seoStrengths: string[] = [];
    const seoWeaknesses: string[] = [];

    if (websiteRes.rows.length > 0) {
      const websiteId = websiteRes.rows[0].id;

      const pagesRes = await db.query(
        `SELECT url, title, meta_description, word_count 
         FROM pages 
         WHERE website_id = $1`,
        [websiteId]
      );
      pagesCrawled = pagesRes.rows.length;

      let indexableCount = 0;
      let hasMetaDescCount = 0;

      for (const page of pagesRes.rows) {
        if (page.word_count > 100) indexableCount++;
        if (page.meta_description) hasMetaDescCount++;

        // Extract services & topics from title and headings
        const textSample = `${page.title || ''} ${JSON.stringify(page.headings || {})}`.toLowerCase();
        if (textSample.includes('ai') || textSample.includes('artificial intelligence') || textSample.includes('machine learning')) {
          servicesDetected.add('AI & Machine Learning');
        }
        if (textSample.includes('cloud') || textSample.includes('devops') || textSample.includes('aws')) {
          servicesDetected.add('Cloud & DevOps');
        }
        if (textSample.includes('mobile') || textSample.includes('ios') || textSample.includes('android')) {
          servicesDetected.add('Mobile App Development');
        }
        if (textSample.includes('web') || textSample.includes('full-stack') || textSample.includes('react')) {
          servicesDetected.add('Web Application Engineering');
        }
        if (textSample.includes('enterprise') || textSample.includes('consulting')) {
          topicsDetected.add('Enterprise Consulting');
        }
        if (textSample.includes('fintech') || textSample.includes('healthcare') || textSample.includes('saas')) {
          topicsDetected.add('Industry Vertical Solutions');
        }
      }

      if (pagesCrawled > 0) {
        if (indexableCount / pagesCrawled > 0.8) {
          seoStrengths.push('High page indexability ratio');
        }
        if (hasMetaDescCount / pagesCrawled > 0.7) {
          seoStrengths.push('Consistent meta descriptions across service pages');
        }
        if (indexableCount / pagesCrawled < 0.5) {
          seoWeaknesses.push('High proportion of non-indexable/thin pages');
        }
      }
    }

    // 2. AI Mentions & Recommendation Stats
    const aiMentionsRes = await db.query(
      `SELECT 
          COUNT(*) as mention_count,
          SUM(CASE WHEN recommendation_signal IS TRUE THEN 1 ELSE 0 END) as rec_count
       FROM ai_competitor_mentions
       WHERE organization_id = $1 
         AND (competitor_name ILIKE $2 OR competitor_name ILIKE $3)`,
      [organizationId, `%${competitor.name}%`, `%${competitor.domain}%`]
    );
    const mentionCount = parseInt(aiMentionsRes.rows[0]?.mention_count || '0', 10);
    const recCount = parseInt(aiMentionsRes.rows[0]?.rec_count || '0', 10);

    // 3. AI Citations Stats
    const aiCitationsRes = await db.query(
      `SELECT COUNT(*) as cite_count
       FROM ai_citations
       WHERE organization_id = $1 AND cited_domain ILIKE $2`,
      [organizationId, `%${competitor.domain}%`]
    );
    const citeCount = parseInt(aiCitationsRes.rows[0]?.cite_count || '0', 10);

    const profile: CompetitorProfile = {
      id: competitor.id,
      organization_id: organizationId,
      competitor_id: competitor.id,
      competitor_name: competitor.name,
      domain: competitor.domain,
      url: competitor.url,
      services_detected: Array.from(servicesDetected),
      topics_detected: Array.from(topicsDetected),
      pages_crawled: pagesCrawled,
      seo_strengths: seoStrengths,
      seo_weaknesses: seoWeaknesses,
      ai_mention_count: mentionCount,
      ai_recommendation_count: recCount,
      ai_citation_count: citeCount,
      last_analyzed_at: new Date()
    };

    // Upsert into competitor_profiles snapshot
    await db.query(
      `INSERT INTO competitor_profiles 
       (organization_id, competitor_id, services_detected, topics_detected, pages_crawled, seo_strengths, seo_weaknesses, ai_mention_count, ai_recommendation_count, ai_citation_count, last_analyzed_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO NOTHING`,
      [
        organizationId,
        competitor.id,
        profile.services_detected,
        profile.topics_detected,
        profile.pages_crawled,
        profile.seo_strengths,
        profile.seo_weaknesses,
        profile.ai_mention_count,
        profile.ai_recommendation_count,
        profile.ai_citation_count
      ]
    );

    return profile;
  }
}
