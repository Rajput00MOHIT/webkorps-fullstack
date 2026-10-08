import { SitemapDiscoverer } from './crawler/sitemapDiscoverer.js';
import { ContentExtractor } from './extractor/contentExtractor.js';
import { ParentChildChunker } from './chunking/parentChildChunker.js';
import { db } from '../../db/client.js';
import { defaultEmbeddingProvider } from '../../providers/embedding/localEmbedding.provider.js';

export interface IngestionResult {
  pagesDiscovered: number;
  pagesCrawled: number;
  chunksCreated: number;
  errors: string[];
}

export class WebsiteIngestionEngine {
  public static async runFullIngestion(organizationId: string, sitemapUrl: string = 'https://www.webkorps.com/sitemap.xml'): Promise<IngestionResult> {
    console.log(`[Ingestion] Starting full crawl & knowledge ingestion from ${sitemapUrl}...`);
    const errors: string[] = [];
    let chunksCreated = 0;

    // 0. Ensure Website record exists for Webkorps
    let websiteRes = await db.query(
      `SELECT id FROM websites WHERE organization_id = $1 LIMIT 1`,
      [organizationId]
    );
    let websiteId = websiteRes.rows[0]?.id;
    if (!websiteId) {
      const insWeb = await db.query(
        `INSERT INTO websites (organization_id, domain, name, is_primary)
         VALUES ($1, 'webkorps.com', 'Webkorps Main Site', true)
         RETURNING id`,
        [organizationId]
      );
      websiteId = insWeb.rows[0].id;
    }

    // 1. Discover URLs from Sitemap
    const urls = await SitemapDiscoverer.discoverUrls(sitemapUrl);
    console.log(`[Ingestion] Discovered ${urls.length} URLs from sitemap.`);

    // 2. Fetch, Clean, and Chunk Each Page
    for (const url of urls) {
      try {
        console.log(`[Ingestion] Processing ${url}...`);
        const extracted = await ContentExtractor.extractFromUrl(url);
        if (!extracted.cleanText || extracted.cleanText.length < 50) {
          continue;
        }

        // Upsert Page in DB
        const pageRes = await db.query(
          `INSERT INTO pages (organization_id, website_id, url, path, title, meta_description, word_count, content_hash, page_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (website_id, url) 
           DO UPDATE SET title = EXCLUDED.title, meta_description = EXCLUDED.meta_description, last_crawled_at = NOW()
           RETURNING id`,
          [
            organizationId,
            websiteId,
            url,
            new URL(url).pathname,
            extracted.title,
            extracted.metaDescription,
            extracted.wordCount,
            extracted.contentHash,
            extracted.pageType
          ]
        );
        const pageId = pageRes.rows[0].id;

        // Create Structure-Aware Chunks
        const chunks = ParentChildChunker.createChunks(pageId, url, extracted.title, extracted.cleanText, extracted.pageType);

        for (const chunk of chunks) {
          const emb = await defaultEmbeddingProvider.generateEmbedding(chunk.chunkText);
          await db.query(
            `INSERT INTO knowledge_chunks (
              organization_id, page_id, section_heading, chunk_text, chunk_type, source_url, content_hash
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              organizationId,
              pageId,
              chunk.sectionHeading,
              chunk.chunkText,
              chunk.chunkType,
              url,
              chunk.contentHash
            ]
          );
          chunksCreated++;
        }
      } catch (err: any) {
        console.error(`[Ingestion Error] Failed ${url}:`, err.message);
        errors.push(`${url}: ${err.message}`);
      }
    }

    console.log(`[Ingestion Complete] Ingested ${urls.length} pages, created ${chunksCreated} chunks.`);
    return {
      pagesDiscovered: urls.length,
      pagesCrawled: urls.length - errors.length,
      chunksCreated,
      errors
    };
  }
}
