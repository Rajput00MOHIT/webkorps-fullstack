import * as cheerio from 'cheerio';
import * as crypto from 'crypto';

export interface ExtractedPage {
  url: string;
  title: string;
  metaDescription: string;
  cleanText: string;
  pageType: string;
  wordCount: number;
  contentHash: string;
}

export class ContentExtractor {
  public static async extractFromUrl(url: string): Promise<ExtractedPage> {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 WebkorpsCorpTalkIndexer/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(12000)
    });

    const html = await resp.text();
    const $ = cheerio.load(html);

    // Strip scripts, styles, noscript, nav, footer
    $('script, style, noscript, nav, footer, header, svg, iframe, link').remove();

    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Webkorps';
    const metaDescription = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';

    // Extract text blocks
    const paragraphs: string[] = [];
    $('h1, h2, h3, h4, p, li').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text.length > 20 && !paragraphs.includes(text)) {
        paragraphs.push(text);
      }
    });

    const cleanText = paragraphs.join('\n\n');
    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
    const contentHash = crypto.createHash('sha256').update(cleanText).digest('hex');

    // Determine Page Type
    let pageType = 'GENERAL';
    const path = new URL(url).pathname.toLowerCase();
    if (path.includes('service') || path.includes('-development') || path.includes('custom-software')) {
      pageType = 'SERVICE';
    } else if (path.includes('industry')) {
      pageType = 'INDUSTRY';
    } else if (path.includes('case-study')) {
      pageType = 'CASE_STUDY';
    } else if (path.includes('about')) {
      pageType = 'ABOUT';
    } else if (path.includes('contact') || path.includes('join')) {
      pageType = 'CONTACT';
    }

    return {
      url,
      title,
      metaDescription,
      cleanText,
      pageType,
      wordCount,
      contentHash
    };
  }
}
