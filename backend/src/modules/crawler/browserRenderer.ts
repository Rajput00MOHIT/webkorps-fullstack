/**
 * Optional JavaScript Browser Rendering Fallback.
 * Attempts headless browser rendering if Playwright is available,
 * otherwise falls back cleanly to static HTML retrieval.
 */
export class BrowserRenderer {
  public static async render(url: string): Promise<{ html: string; rendered: boolean }> {
    try {
      // Dynamically attempt Playwright if installed in runtime
      // @ts-ignore
      const playwright = await import("playwright");
      if (playwright && playwright.chromium) {
        const browser = await playwright.chromium.launch({ headless: true });
        const context = await browser.newContext({ userAgent: "CorpTalk-UniversalCrawler/1.0" });
        const page = await context.newPage();
        await page.goto(url, { waitUntil: "networkidle", timeout: 8000 });
        const html = await page.content();
        await browser.close();
        return { html, rendered: true };
      }
    } catch {}

    // Graceful fallback to standard HTTP fetch
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "CorpTalk-UniversalCrawler/1.0 (Mozilla/5.0 compatible)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Connection": "close"
        },
        signal: AbortSignal.timeout(8000)
      });
      const html = await response.text();
      return { html, rendered: false };
    } catch (err: any) {
      throw new Error(`Failed to fetch ${url}: ${err.message}`);
    }
  }
}
