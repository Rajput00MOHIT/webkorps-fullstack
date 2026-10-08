import * as cheerio from 'cheerio';
import { URL } from 'url';
import { URLNormalizer } from './urlNormalizer.js';

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export class SitemapParser {
  public static async discoverSitemaps(baseUrl: string, declaredSitemaps: string[] = []): Promise<SitemapEntry[]> {
    const candidates = new Set<string>(declaredSitemaps);
    try {
      const u = new URL(baseUrl);
      candidates.add(`${u.protocol}//${u.host}/sitemap.xml`);
      candidates.add(`${u.protocol}//${u.host}/sitemap_index.xml`);
      candidates.add(`${u.protocol}//${u.host}/sitemaps.xml`);
    } catch {
      // ignore
    }

    const allEntries: Map<string, SitemapEntry> = new Map();
    const visitedSitemaps = new Set<string>();

    for (const sitemapUrl of candidates) {
      await this.crawlSitemapRecursive(sitemapUrl, allEntries, visitedSitemaps, 0);
    }

    return Array.from(allEntries.values());
  }

  private static async crawlSitemapRecursive(
    sitemapUrl: string,
    allEntries: Map<string, SitemapEntry>,
    visited: Set<string>,
    depth: number
  ): Promise<void> {
    if (depth > 3 || visited.has(sitemapUrl)) return;
    visited.add(sitemapUrl);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(sitemapUrl, {
        headers: { 'User-Agent': 'CorpTalkBot/1.0 (+https://corp-talk.ai/bot)' },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) return;

      const xml = await res.text();
      const $ = cheerio.load(xml, { xmlMode: true });

      // 1. Check for sitemap index (nested sitemaps)
      const subSitemaps: string[] = [];
      $('sitemap > loc').each((_, el) => {
        const loc = $(el).text().trim();
        if (loc) subSitemaps.push(loc);
      });

      if (subSitemaps.length > 0) {
        for (const sub of subSitemaps) {
          await this.crawlSitemapRecursive(sub, allEntries, visited, depth + 1);
        }
        return;
      }

      // 2. Extract url items
      $('url').each((_, el) => {
        const loc = $(el).find('loc').text().trim();
        if (loc) {
          const normalized = URLNormalizer.normalize(loc);
          if (normalized && !allEntries.has(normalized)) {
            allEntries.set(normalized, {
              url: normalized,
              lastmod: $(el).find('lastmod').text().trim() || undefined,
              changefreq: $(el).find('changefreq').text().trim() || undefined,
              priority: $(el).find('priority').text().trim() || undefined
            });
          }
        }
      });
    } catch {
      // Quietly ignore failed sitemap fetch
    }
  }
}
