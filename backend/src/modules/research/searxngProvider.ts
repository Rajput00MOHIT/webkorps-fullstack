import type { SearchProvider, SearchRequest, SearchResponse, SearchResult } from './searchProvider.js';
import { SearchProviderUnavailableError } from './searchProvider.js';
import { SSRFGuard } from '../crawler/ssrfGuard.js';

export class SearXNGSearchProvider implements SearchProvider {
  public name = 'searxng';
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl || process.env.SEARXNG_BASE_URL || process.env.SEARXNG_URL || '').replace(/\/$/, '');
  }

  public async isAvailable(): Promise<boolean> {
    if (!this.baseUrl) return false;
    try {
      const res = await fetch(`${this.baseUrl}/healthz`, { signal: AbortSignal.timeout(2000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async search(input: SearchRequest): Promise<SearchResponse> {
    if (!this.baseUrl) {
      throw new SearchProviderUnavailableError('SEARXNG_BASE_URL is not configured.');
    }

    const limit = input.limit || 10;
    const params = new URLSearchParams({
      q: input.query,
      format: 'json',
      language: input.language || 'en',
      safesearch: input.safeSearch ? '1' : '0'
    });

    try {
      const response = await fetch(`${this.baseUrl}/search?${params.toString()}`, {
        signal: AbortSignal.timeout(8000),
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CorpTalk-ResearchBot/1.0'
        }
      });

      if (!response.ok) {
        throw new SearchProviderUnavailableError(`SearXNG HTTP error ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      if (!data || !Array.isArray(data.results)) {
        return {
          provider: this.name,
          query: input.query,
          results: [],
          fetchedAt: new Date()
        };
      }

      const results: SearchResult[] = [];
      let rank = 1;

      for (const item of data.results) {
        if (!item.url || results.length >= limit) continue;

        // SSRF Guard validation
        const guard = await SSRFGuard.validateUrl(item.url);
        if (!guard.safe) continue;

        try {
          const parsed = new URL(item.url);
          results.push({
            title: item.title || parsed.hostname,
            url: item.url,
            domain: parsed.hostname,
            snippet: item.content || item.snippet || '',
            rank: rank++,
            sourceProvider: this.name
          });
        } catch {}
      }

      return {
        provider: this.name,
        query: input.query,
        results,
        fetchedAt: new Date()
      };
    } catch (err: any) {
      if (err instanceof SearchProviderUnavailableError) throw err;
      throw new SearchProviderUnavailableError(`SearXNG search failed: ${err.message}`);
    }
  }
}
