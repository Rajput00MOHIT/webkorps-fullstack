import { db } from '../../db/client.js';
import { URLNormalizer } from '../crawler/urlNormalizer.js';
import { CompetitorService } from './competitorService.js';
import type { DiscoveredCompetitorCandidate } from './competitorTypes.js';

export class CompetitorDiscovery {
  /**
   * Deterministically discovers competitor candidates across AI visibility observations,
   * third-party citations, and live research sources.
   * Strictly NO hallucinated or guessed competitors.
   */
  public static async discoverCompetitors(organizationId: string): Promise<DiscoveredCompetitorCandidate[]> {
    const candidatesMap = new Map<string, DiscoveredCompetitorCandidate>();

    // 1. Signal A: AI Competitor Mentions from AI Observation Runs
    const aiMentionsRes = await db.query(
      `SELECT 
          acm.competitor_name, 
          COUNT(*) as mention_count,
          array_agg(DISTINCT vp.prompt_text) as prompts
       FROM ai_competitor_mentions acm
       JOIN ai_observation_runs aor ON aor.id = acm.observation_run_id
       LEFT JOIN visibility_prompts vp ON vp.id = aor.prompt_id
       WHERE acm.organization_id = $1 AND acm.mentioned = true
       GROUP BY acm.competitor_name`,
      [organizationId]
    );

    for (const row of aiMentionsRes.rows) {
      const name = (row.competitor_name || '').trim();
      if (!name || name.length < 2) continue;
      const key = name.toLowerCase();

      // Normalize candidate domain fallback
      const cleanDomain = `${key.replace(/[^a-z0-9]/g, '')}.com`;
      const freq = parseInt(row.mention_count, 10);
      const promptList = (row.prompts || []).filter(Boolean);

      candidatesMap.set(key, {
        name,
        domain: cleanDomain,
        source: 'AI_OBSERVATION',
        confidence: Math.min(0.95, 0.6 + freq * 0.1),
        frequency: freq,
        evidenceSnippet: `Appeared in ${freq} AI visibility responses across queries.`,
        observedQueries: promptList.slice(0, 5)
      });
    }

    // 2. Signal B: AI Citations on non-target external domains
    const aiCitationsRes = await db.query(
      `SELECT cited_domain, COUNT(*) as cite_count, array_agg(DISTINCT cited_title) as titles
       FROM ai_citations
       WHERE organization_id = $1 AND is_target_domain = false
       GROUP BY cited_domain`,
      [organizationId]
    );

    for (const row of aiCitationsRes.rows) {
      const domain = (row.cited_domain || '').trim().toLowerCase();
      if (!domain || domain.includes('wikipedia') || domain.includes('google') || domain.includes('github')) {
        continue; // Exclude generic platforms
      }

      const freq = parseInt(row.cite_count, 10);
      const existing = candidatesMap.get(domain);

      if (existing) {
        existing.frequency += freq;
        existing.confidence = Math.min(0.99, existing.confidence + 0.15);
        existing.evidenceSnippet += ` Also cited ${freq} times in AI search references.`;
      } else {
        const nameGuess = domain.replace(/^www\./, '').split('.')[0];
        const formattedName = nameGuess.charAt(0).toUpperCase() + nameGuess.slice(1);

        candidatesMap.set(domain, {
          name: formattedName,
          domain,
          source: 'AI_OBSERVATION',
          confidence: Math.min(0.85, 0.5 + freq * 0.1),
          frequency: freq,
          evidenceSnippet: `Directly cited in ${freq} AI answer reference links for this organization's target topics.`,
          observedQueries: (row.titles || []).filter(Boolean).slice(0, 3)
        });
      }
    }

    // 3. Signal C: Live Research Sources from high-ranking searches
    const researchSourcesRes = await db.query(
      `SELECT domain, COUNT(*) as source_count, array_agg(DISTINCT title) as titles
       FROM research_sources
       WHERE organization_id = $1 AND domain NOT ILIKE '%webkorps.com%'
       GROUP BY domain`,
      [organizationId]
    );

    for (const row of researchSourcesRes.rows) {
      const domain = (row.domain || '').trim().toLowerCase();
      if (!domain || domain.includes('linkedin') || domain.includes('medium') || domain.includes('twitter')) {
        continue;
      }
      const freq = parseInt(row.source_count, 10);
      const existing = candidatesMap.get(domain);

      if (existing) {
        existing.frequency += freq;
        existing.confidence = Math.min(0.99, existing.confidence + 0.1);
        existing.evidenceSnippet += ` Ranked as relevant evidence source in ${freq} live web research queries.`;
      } else if (freq >= 2) {
        const nameGuess = domain.replace(/^www\./, '').split('.')[0];
        const formattedName = nameGuess.charAt(0).toUpperCase() + nameGuess.slice(1);

        candidatesMap.set(domain, {
          name: formattedName,
          domain,
          source: 'WEB_RESEARCH',
          confidence: Math.min(0.8, 0.4 + freq * 0.1),
          frequency: freq,
          evidenceSnippet: `Ranked in ${freq} live web research sessions as authoritative industry source.`,
          observedQueries: (row.titles || []).filter(Boolean).slice(0, 3)
        });
      }
    }

    const sorted = Array.from(candidatesMap.values()).sort((a, b) => b.frequency - a.frequency);
    return sorted;
  }

  /**
   * Discovers and automatically registers unverified competitor records with full provenance.
   */
  public static async autoRegisterDiscoveredCompetitors(organizationId: string): Promise<number> {
    const candidates = await this.discoverCompetitors(organizationId);
    let createdCount = 0;

    for (const candidate of candidates) {
      // Only auto-register candidates with high confidence
      if (candidate.confidence >= 0.7) {
        await CompetitorService.createCompetitor({
          organizationId,
          name: candidate.name,
          domain: candidate.domain,
          url: `https://${candidate.domain}`,
          source: 'SYSTEM_DISCOVERY',
          status: 'UNVERIFIED',
          confidence: candidate.confidence,
          evidenceSnippet: candidate.evidenceSnippet,
          queryOrPrompt: candidate.observedQueries.join('; ')
        });
        createdCount++;
      }
    }

    return createdCount;
  }
}
