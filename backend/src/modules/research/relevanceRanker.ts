import { URLNormalizer } from '../crawler/urlNormalizer.js';
import { SourceQualityClassifier } from './sourceQuality.js';
import type { SearchResult } from './searchProvider.js';

export interface ScoredSource {
  result: SearchResult;
  normalizedUrl: string;
  relevanceScore: number;
  qualityTier: string;
  qualityScore: number;
}

export class RelevanceRanker {
  /**
   * Scores and ranks search candidates, deduplicating duplicate normalized URLs and domains
   */
  public static rank(query: string, results: SearchResult[], maxCount: number = 5): ScoredSource[] {
    const queryTokens = this.tokenize(query);
    const seenUrls = new Set<string>();
    const seenDomains = new Map<string, number>();
    const scored: ScoredSource[] = [];

    for (const res of results) {
      if (!res.url) continue;

      const normalized = URLNormalizer.normalize(res.url);
      if (!normalized || seenUrls.has(normalized)) continue;
      seenUrls.add(normalized);

      // Max 2 results per domain to ensure diversity
      const domainCount = seenDomains.get(res.domain) || 0;
      if (domainCount >= 2) continue;
      seenDomains.set(res.domain, domainCount + 1);

      const titleTokens = this.tokenize(res.title);
      const snippetTokens = this.tokenize(res.snippet || '');

      // 1. Term overlap
      const titleMatch = this.tokenOverlap(queryTokens, titleTokens);
      const snippetMatch = this.tokenOverlap(queryTokens, snippetTokens);

      // 2. Source quality
      const qualityEval = SourceQualityClassifier.evaluate(res.url);

      // 3. Rank position bonus (earlier in search = higher)
      const rankBonus = res.rank ? Math.max(0, (10 - res.rank) / 10) * 0.2 : 0.1;

      // Deterministic relevance calculation
      const score = Math.min(
        1.0,
        Number((titleMatch * 0.4 + snippetMatch * 0.3 + qualityEval.baseScore * 0.2 + rankBonus).toFixed(3))
      );

      scored.push({
        result: res,
        normalizedUrl: normalized,
        relevanceScore: score,
        qualityTier: qualityEval.tier,
        qualityScore: qualityEval.baseScore
      });
    }

    // Sort descending by relevance score
    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return scored.slice(0, maxCount);
  }

  /**
   * Extracts evidence passages from extracted body text
   */
  public static extractPassages(query: string, text: string, maxPassages: number = 3): Array<{ text: string; score: number }> {
    if (!text || text.trim().length === 0) return [];

    const queryTokens = this.tokenize(query);
    // Split text into paragraphs or sentence blocks
    const paragraphs = text
      .split(/\n\s*\n|\r\n\s*\r\n/)
      .map(p => p.trim())
      .filter(p => p.length > 50 && p.length < 1500);

    const scoredPassages: Array<{ text: string; score: number }> = [];

    for (const p of paragraphs) {
      const tokens = this.tokenize(p);
      const match = this.tokenOverlap(queryTokens, tokens);
      if (match > 0.05) {
        scoredPassages.push({
          text: p,
          score: Number(match.toFixed(3))
        });
      }
    }

    scoredPassages.sort((a, b) => b.score - a.score);
    return scoredPassages.slice(0, maxPassages);
  }

  private static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2);
  }

  private static tokenOverlap(queryTokens: string[], docTokens: string[]): number {
    if (queryTokens.length === 0 || docTokens.length === 0) return 0;
    const docSet = new Set(docTokens);
    let matched = 0;
    for (const token of queryTokens) {
      if (docSet.has(token)) matched++;
    }
    return matched / queryTokens.length;
  }
}
