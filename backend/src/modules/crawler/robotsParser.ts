import { URL } from 'url';

export interface RobotsInfo {
  exists: boolean;
  rawText?: string;
  sitemaps: string[];
  disallowedPatterns: string[];
  allowedPatterns: string[];
  crawlDelay?: number;
}

export class RobotsParser {
  private allowed: string[] = [];
  private disallowed: string[] = [];
  private sitemaps: string[] = [];
  private crawlDelay?: number;
  private rawText = '';
  public exists = false;

  public static async fetchAndParse(baseUrl: string): Promise<RobotsParser> {
    const parser = new RobotsParser();
    try {
      const parsedBase = new URL(baseUrl);
      const robotsUrl = `${parsedBase.protocol}//${parsedBase.host}/robots.txt`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(robotsUrl, {
        headers: { 'User-Agent': 'CorpTalkBot/1.0 (+https://corp-talk.ai/bot)' },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (res.ok) {
        const text = await res.text();
        parser.parse(text);
        parser.exists = true;
      }
    } catch {
      // Robots.txt unreachable or 404 - defaults to allow all
      parser.exists = false;
    }
    return parser;
  }

  public parse(content: string): void {
    this.rawText = content;
    const lines = content.split(/\r?\n/);
    let appliesToBot = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;

      const key = line.slice(0, colonIdx).trim().toLowerCase();
      const value = line.slice(colonIdx + 1).trim();

      if (key === 'user-agent') {
        const ua = value.toLowerCase();
        appliesToBot = ua === '*' || ua.includes('corptalk') || ua.includes('bot');
      } else if (appliesToBot) {
        if (key === 'disallow' && value) {
          this.disallowed.push(value);
        } else if (key === 'allow' && value) {
          this.allowed.push(value);
        } else if (key === 'crawl-delay') {
          const delay = parseFloat(value);
          if (!isNaN(delay)) this.crawlDelay = delay;
        }
      }

      if (key === 'sitemap' && value) {
        this.sitemaps.push(value);
      }
    }
  }

  public isAllowed(urlString: string): boolean {
    if (!this.exists) return true;
    try {
      const path = new URL(urlString).pathname;

      // Check allow first (more specific wins or explicit allow)
      for (const allowPattern of this.allowed) {
        if (this.matchesPattern(path, allowPattern)) {
          return true;
        }
      }

      // Check disallow
      for (const disallowPattern of this.disallowed) {
        if (this.matchesPattern(path, disallowPattern)) {
          return false;
        }
      }

      return true;
    } catch {
      return true;
    }
  }

  private matchesPattern(path: string, pattern: string): boolean {
    if (pattern === '/') return true;
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return path.startsWith(prefix);
    }
    return path.startsWith(pattern);
  }

  public getSummary(): RobotsInfo {
    return {
      exists: this.exists,
      rawText: this.rawText,
      sitemaps: this.sitemaps,
      disallowedPatterns: this.disallowed,
      allowedPatterns: this.allowed,
      crawlDelay: this.crawlDelay
    };
  }
}
