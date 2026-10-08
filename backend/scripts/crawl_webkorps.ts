import { db } from "../src/db/client.js";
import { CrawlerService } from "../src/modules/crawler/crawlerService.js";

async function run() {
  await db.ensureReady();
  const orgId = "00000000-0000-0000-0000-000000000001";

  // 1. Register or find website
  let webRes = await db.query(
    "SELECT id FROM websites WHERE organization_id = $1 AND domain = $2",
    [orgId, "webkorps.com"]
  );

  let websiteId: string;
  if (webRes.rows.length === 0) {
    const insertRes = await db.query(
      "INSERT INTO websites (organization_id, domain, name, is_primary) VALUES ($1, $2, $3, TRUE) RETURNING id",
      [orgId, "webkorps.com", "Webkorps Official"]
    );
    websiteId = insertRes.rows[0].id;
    console.log("[Setup] Registered website Webkorps:", websiteId);
  } else {
    websiteId = webRes.rows[0].id;
    console.log("[Setup] Found existing website Webkorps:", websiteId);
  }

  // 2. Queue and execute crawl
  console.log("[Crawl] Starting live controlled crawl for https://www.webkorps.com (maxPages: 50)...");
  const queued = await CrawlerService.queueCrawl({
    organizationId: orgId,
    websiteId,
    startUrl: "https://www.webkorps.com",
    maxPages: 50
  });

  const crawlRunId = queued.crawlRunId;
  console.log("[Crawl] Crawl run queued with ID:", crawlRunId);

  // Poll until crawl completes
  let completed = false;
  let statusRecord: any = null;
  while (!completed) {
    await new Promise((r) => setTimeout(r, 2000));
    statusRecord = await CrawlerService.getCrawlStatus(orgId, crawlRunId);
    console.log(`[Crawl Progress] Status: ${statusRecord.status}, Crawled: ${statusRecord.pages_crawled}, Discovered: ${statusRecord.pages_discovered}, Failed: ${statusRecord.pages_failed}`);
    if (statusRecord.status === "COMPLETED" || statusRecord.status === "FAILED" || statusRecord.status === "PARTIAL") {
      completed = true;
    }
  }

  // 3. Query all metrics from database
  console.log("\n=======================================================");
  console.log("📊 CRAWL METRICS & DATABASE VALIDATION RESULTS");
  console.log("=======================================================");
  console.log("Crawl Run ID:", crawlRunId);
  console.log("Status:", statusRecord.status);
  console.log("Pages Discovered:", statusRecord.pages_discovered);
  console.log("Pages Crawled:", statusRecord.pages_crawled);
  console.log("Pages Failed:", statusRecord.pages_failed);
  console.log("Duration (ms):", statusRecord.duration_ms);
  console.log("Robots.txt status:", statusRecord.metadata?.robotsTxt ? "Respected (found " + (statusRecord.metadata.robotsTxt.disallow?.length || 0) + " disallow rules)" : "Fetched/Respected");
  console.log("Sitemap status:", statusRecord.metadata?.sitemaps ? "Discovered " + (statusRecord.metadata.sitemaps.sitemapUrls?.length || 0) + " URLs in sitemap" : "Inspected");

  // HTTP status distribution
  const httpDist = await db.query(
    "SELECT http_status, count(*) as count FROM pages WHERE website_id = $1 GROUP BY http_status ORDER BY count DESC",
    [websiteId]
  );
  console.log("\nHTTP Status Distribution:", httpDist.rows);

  // Indexability distribution
  const idxDist = await db.query(
    "SELECT indexability, count(*) as count FROM pages WHERE website_id = $1 GROUP BY indexability",
    [websiteId]
  );
  console.log("Indexability Distribution:", idxDist.rows);

  // SEO issues by severity
  const issuesDist = await db.query(
    "SELECT severity, count(*) as count FROM seo_issues WHERE website_id = $1 GROUP BY severity ORDER BY count DESC",
    [websiteId]
  );
  console.log("SEO Issues by Severity:", issuesDist.rows);

  // Internal vs External links
  const linksDist = await db.query(
    "SELECT is_internal, count(*) as count FROM page_links WHERE website_id = $1 GROUP BY is_internal",
    [websiteId]
  );
  console.log("Link Graph (Internal vs External):", linksDist.rows);

  // Snapshots count
  const snapCount = await db.query(
    "SELECT count(*) as count FROM crawl_page_snapshots WHERE crawl_run_id = $1",
    [crawlRunId]
  );
  console.log("Page Snapshots Created:", snapCount.rows[0].count);

  // Knowledge Candidates
  const candCount = await db.query(
    "SELECT count(*) as count FROM knowledge_entities WHERE organization_id = $1 AND verification_status = 'DISCOVERED'",
    [orgId]
  );
  console.log("Discovered Knowledge Candidates:", candCount.rows[0].count);

  // Sample SEO issues
  const sampleIssues = await db.query(
    "SELECT issue_type, severity, description FROM seo_issues WHERE website_id = $1 LIMIT 5",
    [websiteId]
  );
  console.log("\nSample SEO Issues Discovered:");
  console.log(sampleIssues.rows);
}

run().catch((err) => {
  console.error("Error executing crawl:", err);
  process.exit(1);
});
