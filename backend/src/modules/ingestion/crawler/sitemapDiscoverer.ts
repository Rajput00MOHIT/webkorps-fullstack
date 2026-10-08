import * as cheerio from 'cheerio';

export class SitemapDiscoverer {
  public static async discoverUrls(sitemapUrl: string = 'https://www.webkorps.com/sitemap.xml'): Promise<string[]> {
    try {
      const resp = await fetch(sitemapUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; WebkorpsCorpTalkIndexer/1.0; +https://webkorps.com)'
        },
        signal: AbortSignal.timeout(10000)
      });
      if (!resp.ok) {
        return this.getFallbackUrls();
      }

      const xml = await resp.text();
      const $ = cheerio.load(xml, { xmlMode: true });
      const urls: string[] = [];

      $('url loc').each((_, el) => {
        const u = $(el).text().trim();
        if (u && !urls.includes(u)) {
          urls.push(u);
        }
      });

      return urls.length > 0 ? urls : this.getFallbackUrls();
    } catch (err) {
      console.warn('[SitemapDiscoverer] Fetch error, using fallback seed list:', err);
      return this.getFallbackUrls();
    }
  }

  public static getFallbackUrls(): string[] {
    return [
      'https://www.webkorps.com/',
      'https://www.webkorps.com/about-us',
      'https://www.webkorps.com/contact',
      'https://www.webkorps.com/join-us',
      'https://www.webkorps.com/case-study',
      'https://www.webkorps.com/custom-software-development',
      'https://www.webkorps.com/mobile-app-development',
      'https://www.webkorps.com/blockchain-development',
      'https://www.webkorps.com/web-development',
      'https://www.webkorps.com/ai-ml-development',
      'https://www.webkorps.com/enterprise-software-development',
      'https://www.webkorps.com/ecommerce-development',
      'https://www.webkorps.com/cloud-application-development',
      'https://www.webkorps.com/iot-application-development',
      'https://www.webkorps.com/managed-it-service',
      'https://www.webkorps.com/it-staff-augmentation',
      'https://www.webkorps.com/industry/logistics',
      'https://www.webkorps.com/industry/healthcare',
      'https://www.webkorps.com/industry/fintech',
      'https://www.webkorps.com/industry/ecommerce'
    ];
  }
}
