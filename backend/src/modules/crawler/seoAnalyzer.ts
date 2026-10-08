import type { ExtractedPageData } from './htmlExtractor.js';

export interface SeoIssueCandidate {
  issueType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  evidence: Record<string, any>;
  recommendation: string;
}

export class SeoAnalyzer {
  public static analyze(
    url: string,
    httpStatus: number,
    data: ExtractedPageData
  ): { issues: SeoIssueCandidate[]; indexability: 'INDEXABLE' | 'NOT_INDEXABLE' | 'UNKNOWN'; indexabilityReason: string } {
    const issues: SeoIssueCandidate[] = [];

    // 1. HTTP Status Checks
    if (httpStatus >= 400 && httpStatus < 500) {
      issues.push({
        issueType: 'HTTP_STATUS_4XX',
        severity: 'CRITICAL',
        evidence: { url, status: httpStatus },
        recommendation: `Fix broken link or configure redirect for 4xx status response on ${url}.`
      });
      return { issues, indexability: 'NOT_INDEXABLE', indexabilityReason: `HTTP status ${httpStatus} error` };
    }

    if (httpStatus >= 500) {
      issues.push({
        issueType: 'HTTP_STATUS_5XX',
        severity: 'CRITICAL',
        evidence: { url, status: httpStatus },
        recommendation: `Resolve server-side 5xx error on ${url}.`
      });
      return { issues, indexability: 'NOT_INDEXABLE', indexabilityReason: `Server 5xx error (${httpStatus})` };
    }

    // 2. Indexability Determination
    let indexability: 'INDEXABLE' | 'NOT_INDEXABLE' | 'UNKNOWN' = 'INDEXABLE';
    let indexabilityReason = 'Status 200 and no index-blocking directives found.';

    if (data.isNoindex) {
      indexability = 'NOT_INDEXABLE';
      indexabilityReason = 'Meta robots tag contains noindex directive.';
      issues.push({
        issueType: 'NOINDEX_DETECTED',
        severity: 'INFO',
        evidence: { url, robotsMeta: data.robotsMeta },
        recommendation: 'Verify if page was intentionally excluded from search indexes.'
      });
    }

    // 3. Title Checks
    if (!data.title) {
      issues.push({
        issueType: 'MISSING_TITLE',
        severity: 'CRITICAL',
        evidence: { url },
        recommendation: 'Add a descriptive <title> tag between 30 and 60 characters.'
      });
    } else if (data.title.length < 20) {
      issues.push({
        issueType: 'SHORT_TITLE',
        severity: 'LOW',
        evidence: { url, title: data.title, length: data.title.length },
        recommendation: 'Expand title to include relevant primary entity keywords (aim for 30-60 characters).'
      });
    } else if (data.title.length > 70) {
      issues.push({
        issueType: 'LONG_TITLE',
        severity: 'LOW',
        evidence: { url, title: data.title, length: data.title.length },
        recommendation: 'Shorten title to prevent truncation in search result snippets (under 60-70 characters).'
      });
    }

    // 4. Meta Description Checks
    if (!data.metaDescription) {
      issues.push({
        issueType: 'MISSING_META_DESCRIPTION',
        severity: 'HIGH',
        evidence: { url },
        recommendation: 'Provide a compelling meta description between 120 and 160 characters summarizing the page.'
      });
    } else if (data.metaDescription.length < 50) {
      issues.push({
        issueType: 'SHORT_META_DESCRIPTION',
        severity: 'LOW',
        evidence: { url, description: data.metaDescription, length: data.metaDescription.length },
        recommendation: 'Expand meta description to at least 120 characters to improve search click-through rate.'
      });
    } else if (data.metaDescription.length > 170) {
      issues.push({
        issueType: 'LONG_META_DESCRIPTION',
        severity: 'LOW',
        evidence: { url, description: data.metaDescription, length: data.metaDescription.length },
        recommendation: 'Shorten meta description to under 160 characters to avoid SERP snippet truncation.'
      });
    }

    // 5. Headings (H1) Checks
    if (data.h1Tags.length === 0) {
      issues.push({
        issueType: 'MISSING_H1',
        severity: 'HIGH',
        evidence: { url },
        recommendation: 'Add a single primary <h1> heading defining the main topic of the page.'
      });
    } else if (data.h1Tags.length > 1) {
      issues.push({
        issueType: 'MULTIPLE_H1',
        severity: 'MEDIUM',
        evidence: { url, h1Tags: data.h1Tags },
        recommendation: 'Consolidate multiple <h1> elements into one primary <h1>, using <h2> for secondary subheadings.'
      });
    }

    // 6. Canonical Checks
    if (!data.canonicalUrl) {
      issues.push({
        issueType: 'CANONICAL_MISSING',
        severity: 'MEDIUM',
        evidence: { url },
        recommendation: 'Specify an explicit self-referencing <link rel="canonical"> tag.'
      });
    } else if (data.canonicalUrl !== url) {
      issues.push({
        issueType: 'CANONICAL_MISMATCH',
        severity: 'HIGH',
        evidence: { url, canonicalTarget: data.canonicalUrl },
        recommendation: 'Ensure canonical points to self or intended master page.'
      });
      indexabilityReason = `Canonical points to alternate URL: ${data.canonicalUrl}`;
    }

    // 7. Thin Content Checks
    if (data.wordCount < 150) {
      issues.push({
        issueType: 'THIN_CONTENT',
        severity: 'MEDIUM',
        evidence: { url, wordCount: data.wordCount },
        recommendation: 'Add substantial descriptive content (aim for at least 300+ informative words).'
      });
    }

    // 8. Image Alt Checks
    const missingAltImages = data.images.filter(img => img.hasMissingAlt || img.hasEmptyAlt);
    if (missingAltImages.length > 0) {
      issues.push({
        issueType: 'IMAGES_MISSING_ALT',
        severity: 'LOW',
        evidence: {
          url,
          totalImages: data.images.length,
          missingAltCount: missingAltImages.length,
          sampleSrcs: missingAltImages.slice(0, 3).map(i => i.src)
        },
        recommendation: `Provide descriptive alt text for ${missingAltImages.length} images to improve accessibility and image SEO.`
      });
    }

    return { issues, indexability, indexabilityReason };
  }
}
