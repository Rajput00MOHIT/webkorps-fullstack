import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { URLNormalizer } from './urlNormalizer.js';

export interface ExtractedHeading {
  level: number;
  text: string;
}

export interface ExtractedImage {
  src: string;
  absoluteUrl: string;
  alt: string;
  title?: string;
  hasMissingAlt: boolean;
  hasEmptyAlt: boolean;
}

export interface ExtractedLink {
  href: string;
  absoluteUrl: string;
  anchorText: string;
  isInternal: boolean;
  rel?: string;
}

export interface ExtractedPageData {
  title: string;
  metaDescription: string;
  canonicalUrl: string | null;
  robotsMeta: string | null;
  isNoindex: boolean;
  isNofollow: boolean;
  language: string | null;
  headings: ExtractedHeading[];
  h1Tags: string[];
  h2Tags: string[];
  h3Tags: string[];
  images: ExtractedImage[];
  links: ExtractedLink[];
  internalLinks: ExtractedLink[];
  externalLinks: ExtractedLink[];
  schemas: any[];
  cleanText: string;
  wordCount: number;
  charCount: number;
  contentHash: string;
}

export class HtmlExtractor {
  public static extract(html: string, pageUrl: string, targetDomain: string): ExtractedPageData {
    const $ = cheerio.load(html);

    // 1. Metadata
    const title = $('title').first().text().trim() || '';
    const metaDescription = $('meta[name="description" i]').attr('content')?.trim() || '';
    
    // Canonical link
    const canonicalHref = $('link[rel="canonical" i]').attr('href')?.trim();
    const canonicalUrl = canonicalHref ? URLNormalizer.normalize(canonicalHref, pageUrl) : null;

    // Robots meta
    const robotsMeta = $('meta[name="robots" i]').attr('content')?.toLowerCase() || null;
    const isNoindex = robotsMeta ? robotsMeta.includes('noindex') : false;
    const isNofollow = robotsMeta ? robotsMeta.includes('nofollow') : false;

    const language = $('html').attr('lang')?.trim() || null;

    // 2. Headings in document order
    const headings: ExtractedHeading[] = [];
    const h1Tags: string[] = [];
    const h2Tags: string[] = [];
    const h3Tags: string[] = [];

    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const tag = el.tagName.toLowerCase();
      const level = parseInt(tag[1], 10);
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text) {
        headings.push({ level, text });
        if (level === 1) h1Tags.push(text);
        if (level === 2) h2Tags.push(text);
        if (level === 3) h3Tags.push(text);
      }
    });

    // 3. Images
    const images: ExtractedImage[] = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src')?.trim();
      if (!src) return;

      const altAttr = $(el).attr('alt');
      const hasMissingAlt = altAttr === undefined;
      const hasEmptyAlt = altAttr !== undefined && altAttr.trim() === '';
      const alt = (altAttr || '').trim();
      const titleAttr = $(el).attr('title')?.trim();

      const absUrl = URLNormalizer.normalize(src, pageUrl) || src;

      images.push({
        src,
        absoluteUrl: absUrl,
        alt,
        title: titleAttr,
        hasMissingAlt,
        hasEmptyAlt
      });
    });

    // 4. Structured Data (JSON-LD)
    const schemas: any[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const rawJson = $(el).html();
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          if (Array.isArray(parsed)) {
            schemas.push(...parsed);
          } else {
            schemas.push(parsed);
          }
        }
      } catch {
        // malformed json-ld recorded as empty or skipped
      }
    });

    // 5. Links
    const links: ExtractedLink[] = [];
    const internalLinks: ExtractedLink[] = [];
    const externalLinks: ExtractedLink[] = [];

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')?.trim();
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
        return;
      }

      const absUrl = URLNormalizer.normalize(href, pageUrl);
      if (!absUrl) return;

      const anchorText = $(el).text().replace(/\s+/g, ' ').trim();
      const rel = $(el).attr('rel')?.toLowerCase();
      const isInternal = URLNormalizer.isSameDomain(absUrl, targetDomain);

      const linkObj: ExtractedLink = {
        href,
        absoluteUrl: absUrl,
        anchorText,
        isInternal,
        rel
      };

      links.push(linkObj);
      if (isInternal) {
        internalLinks.push(linkObj);
      } else {
        externalLinks.push(linkObj);
      }
    });

    // 6. Clean Text & Content Hash
    // Clone and strip non-content elements
    const clone$ = cheerio.load(html);
    clone$('script, style, noscript, nav, header, footer, svg, iframe, form').remove();
    const cleanText = clone$('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = cleanText ? cleanText.split(/\s+/).length : 0;
    const charCount = cleanText.length;

    // Deterministic SHA-256 content hash
    const contentHash = crypto.createHash('sha256').update(cleanText).digest('hex');

    return {
      title,
      metaDescription,
      canonicalUrl,
      robotsMeta,
      isNoindex,
      isNofollow,
      language,
      headings,
      h1Tags,
      h2Tags,
      h3Tags,
      images,
      links,
      internalLinks,
      externalLinks,
      schemas,
      cleanText,
      wordCount,
      charCount,
      contentHash
    };
  }
}
