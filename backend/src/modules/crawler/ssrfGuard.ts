import dns from 'dns/promises';
import { URL } from 'url';

/**
 * Validates URLs against SSRF (Server-Side Request Forgery) attacks.
 * Blocks private IP ranges, loopback, link-local, cloud metadata services, and non-HTTP protocols.
 */
export class SSRFGuard {
  // Private and reserved IP blocks
  private static PRIVATE_RANGES = [
    /^127\./,                         // Loopback (127.0.0.0/8)
    /^10\./,                          // Private class A (10.0.0.0/8)
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private class B (172.16.0.0/12)
    /^192\.168\./,                    // Private class C (192.168.0.0/16)
    /^169\.254\./,                    // Link-local / AWS / GCP metadata (169.254.0.0/16)
    /^0\./,                           // 0.0.0.0/8
    /^fc00:/i,                        // IPv6 ULA
    /^fe80:/i,                        // IPv6 link-local
    /^::1$/                           // IPv6 loopback
  ];

  public static async validateUrl(urlString: string, options?: { allowLocal?: boolean }): Promise<{ safe: boolean; reason?: string; resolvedUrl?: URL }> {
    let parsed: URL;
    try {
      parsed = new URL(urlString);
    } catch {
      return { safe: false, reason: 'Malformed URL' };
    }

    // Only allow http and https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: `Forbidden protocol: ${parsed.protocol}. Only http and https are permitted.` };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check common blacklisted names
    const isLocalAllowed = Boolean(options?.allowLocal && (process.env.ALLOW_LOCAL_CRAWL === "true" || process.env.NODE_ENV === "development"));
    if (hostname === "0.0.0.0") {
      return { safe: false, reason: "Access to 0.0.0.0 is blocked." };
    }
    if ((hostname === "localhost" || hostname.endsWith(".localhost")) && !isLocalAllowed) {
      return { safe: false, reason: "Access to localhost / local loopback is blocked." };
    }
    // Reserved test domains per RFC 2606
    if (hostname.endsWith(".example") || hostname.endsWith(".test")) {
      return { safe: true, resolvedUrl: parsed };
    }

    // Resolve DNS and test IP addresses
    try {
      const addresses = await dns.lookup(hostname, { all: true });
      for (const addr of addresses) {
        // 169.254.* link-local metadata is NEVER allowed
        if (/^169\.254\./.test(addr.address)) {
          return {
            safe: false,
            reason: `Destination IP ${addr.address} belongs to cloud metadata network range.`
          };
        }
        const isLoopback = addr.address === "127.0.0.1" || addr.address === "::1" || /^127\./.test(addr.address);
        if (isLoopback && isLocalAllowed) {
          continue;
        }
        if (this.isPrivateIp(addr.address)) {
          return {
            safe: false,
            reason: `Destination IP ${addr.address} belongs to a private, loopback, or metadata network range.`
          };
        }
      }
    } catch (err: any) {
      return { safe: false, reason: `DNS resolution failed for hostname ${hostname}: ${err.message}` };
    }

    return { safe: true, resolvedUrl: parsed };
  }

  public static isPrivateIp(ip: string): boolean {
    for (const range of this.PRIVATE_RANGES) {
      if (range.test(ip)) return true;
    }
    return false;
  }
}
