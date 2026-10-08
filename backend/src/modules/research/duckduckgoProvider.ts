import * as cheerio from "cheerio";
import type { SearchProvider, SearchRequest, SearchResponse, SearchResult } from "./searchProvider.js";
import { SearchProviderUnavailableError } from "./searchProvider.js";
import { SSRFGuard } from "../crawler/ssrfGuard.js";

export class DuckDuckGoSearchProvider implements SearchProvider {
  public name = "duckduckgo";

  public async isAvailable(): Promise<boolean> {
    return true;
  }

  public async search(input: SearchRequest): Promise<SearchResponse> {
    const limit = input.limit || 10;
    const encoded = encodeURIComponent(input.query);

    try {
      const response = await fetch(`https://html.duckduckgo.com/html/?q=${encoded}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        },
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        return this.fallbackInstantApi(input.query, limit);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const results: SearchResult[] = [];
      let rank = 1;

      const elements = $(".result").toArray();
      for (const el of elements) {
        if (results.length >= limit) break;

        const titleEl = $(el).find(".result__title a");
        const snippetEl = $(el).find(".result__snippet");
        const rawUrl = titleEl.attr("href");

        if (!rawUrl) continue;

        let finalUrl = rawUrl;
        if (rawUrl.includes("uddg=")) {
          const match = rawUrl.match(/uddg=([^&]+)/);
          if (match && match[1]) {
            finalUrl = decodeURIComponent(match[1]);
          }
        }

        const guard = await SSRFGuard.validateUrl(finalUrl);
        if (!guard.safe) continue;

        try {
          const parsed = new URL(finalUrl);
          results.push({
            title: titleEl.text().trim() || parsed.hostname,
            url: finalUrl,
            domain: parsed.hostname,
            snippet: snippetEl.text().trim() || "",
            rank: rank++,
            sourceProvider: this.name
          });
        } catch {}
      }

      if (results.length > 0) {
        return {
          provider: this.name,
          query: input.query,
          results,
          fetchedAt: new Date()
        };
      }

      return this.fallbackInstantApi(input.query, limit);
    } catch {
      return this.fallbackInstantApi(input.query, limit);
    }
  }

  private async fallbackInstantApi(query: string, limit: number): Promise<SearchResponse> {
    try {
      const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`, {
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) {
        throw new SearchProviderUnavailableError("DuckDuckGo instant search unreachable.");
      }

      const data = (await res.json()) as any;
      const results: SearchResult[] = [];
      let rank = 1;

      if (data && data.AbstractURL && data.AbstractText) {
        const guard = await SSRFGuard.validateUrl(data.AbstractURL);
        if (guard.safe) {
          results.push({
            title: data.Heading || data.AbstractSource || "Summary",
            url: data.AbstractURL,
            domain: new URL(data.AbstractURL).hostname,
            snippet: data.AbstractText,
            rank: rank++,
            sourceProvider: this.name
          });
        }
      }

      if (data && Array.isArray(data.RelatedTopics)) {
        for (const topic of data.RelatedTopics) {
          if (results.length >= limit) break;
          if (topic.FirstURL && topic.Text) {
            const guard = await SSRFGuard.validateUrl(topic.FirstURL);
            if (guard.safe) {
              results.push({
                title: topic.Text.slice(0, 80),
                url: topic.FirstURL,
                domain: new URL(topic.FirstURL).hostname,
                snippet: topic.Text,
                rank: rank++,
                sourceProvider: this.name
              });
            }
          }
        }
      }

      return {
        provider: this.name,
        query,
        results,
        fetchedAt: new Date()
      };
    } catch (err: any) {
      throw new SearchProviderUnavailableError(`Search failed: ${err.message}`);
    }
  }
}
