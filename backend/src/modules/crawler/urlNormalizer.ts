import { URL } from 'url';

export class URLNormalizer {
  private static TRACKING_PARAMS = new Set([
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'fbclid',
    'gclid',
    'gbraid',
    'wbraid',
    'msclkid',
    'mc_cid',
    'mc_eid',
    '_ga',
    '_gl',
    'ref',
    'source'
  ]);

  /**
   * Normalizes a URL string against a base URL.
   */
  public static normalize(rawUrl: string, baseUrl?: string): string | null {
    try {
      const parsed = baseUrl ? new URL(rawUrl, baseUrl) : new URL(rawUrl);

      // Only allow http and https
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
      }

      // Ignore common non-HTML document links from crawl queue
      const lowerPath = parsed.pathname.toLowerCase();
      if (
        lowerPath.endsWith('.jpg') ||
        lowerPath.endsWith('.jpeg') ||
        lowerPath.endsWith('.png') ||
        lowerPath.endsWith('.gif') ||
        lowerPath.endsWith('.svg') ||
        lowerPath.endsWith('.webp') ||
        lowerPath.endsWith('.pdf') ||
        lowerPath.endsWith('.zip') ||
        lowerPath.endsWith('.tar') ||
        lowerPath.endsWith('.css') ||
        lowerPath.endsWith('.js')
      ) {
        return null;
      }

      // Standardize protocol and hostname
      parsed.protocol = 'https:'; // Prefer HTTPS
      parsed.hostname = parsed.hostname.toLowerCase();
      parsed.hash = ''; // Strip fragment

      // Filter out tracking parameters
      const params = new URLSearchParams(parsed.search);
      const keysToDelete: string[] = [];
      params.forEach((_, key) => {
        if (this.TRACKING_PARAMS.has(key.toLowerCase()) || key.startsWith('utm_')) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(k => params.delete(k));
      parsed.search = params.toString() ? `?${params.toString()}` : '';

      // Clean up path trailing slash (normalize /path/ to /path except for root /)
      let pathname = parsed.pathname.replace(/\/+/g, '/');
      if (pathname.length > 1 && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
      }
      parsed.pathname = pathname;

      return parsed.toString();
    } catch {
      return null;
    }
  }

  /**
   * Verifies if candidate URL belongs to the target website domain
   */
  public static isSameDomain(candidateUrl: string, targetDomain: string): boolean {
    try {
      const candidateHost = new URL(candidateUrl).hostname.toLowerCase();
      const targetHost = targetDomain.toLowerCase().replace(/^(https?:\/\/)/, '').replace(/\/.*$/, '');

      // Exact match or sub-domain
      return candidateHost === targetHost || candidateHost === `www.${targetHost}` || targetHost === `www.${candidateHost}`;
    } catch {
      return false;
    }
  }

  public static extractDomain(urlString: string): string {
    try {
      const formatted = urlString.startsWith("http") ? urlString : "https://" + urlString;
      const host = new URL(formatted).hostname.toLowerCase();
      return host.replace(/^www\./, "");
    } catch {
      return urlString.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/.*$/, "");
    }
  }

  public static getPath(urlString: string): string {
    try {
      const u = new URL(urlString);
      return u.pathname + u.search;
    } catch {
      return '/';
    }
  }
}
