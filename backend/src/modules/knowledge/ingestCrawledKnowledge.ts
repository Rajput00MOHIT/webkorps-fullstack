import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { db } from '../../db/client.js';

export async function ingestAllCrawledIntelligence(): Promise<{
  webkorpsChunksInserted: number;
  itServicesChunksInserted: number;
  entitiesUpdated: number;
}> {
  await db.ensureReady();
  const orgId = '00000000-0000-0000-0000-000000000001';

  console.log('🔄 Ingesting Search Engine & IT Services Crawled Data into Knowledge Graph...');

  const webkorpsPath = path.resolve(process.cwd(), 'data/crawled/webkorps_complete_search_intelligence.json');
  const itServicesPath = path.resolve(process.cwd(), 'data/crawled/it_services_complete_intelligence.json');

  let webkorpsCount = 0;
  let itCount = 0;
  let entitiesCount = 0;

  // 1. Ingest Webkorps Data
  if (fs.existsSync(webkorpsPath)) {
    const data = JSON.parse(fs.readFileSync(webkorpsPath, 'utf-8'));

    // Insert leadership entities
    for (const leader of data.company_profile.leadership) {
      await db.query(
        `INSERT INTO knowledge_entities (organization_id, name, entity_type, attributes, source_url, is_verified)
         VALUES ($1, $2, 'LEADER', $3, 'https://www.webkorps.com/about', TRUE)
         ON CONFLICT DO NOTHING`,
        [orgId, leader.name, JSON.stringify(leader)]
      );
      entitiesCount++;
    }

    // Insert Services
    for (const service of data.services) {
      await db.query(
        `INSERT INTO knowledge_entities (organization_id, name, entity_type, attributes, source_url, is_verified)
         VALUES ($1, $2, 'SERVICE', $3, 'https://www.webkorps.com/services', TRUE)
         ON CONFLICT DO NOTHING`,
        [orgId, service.name, JSON.stringify(service)]
      );
      entitiesCount++;

      // Create Embedding Chunk
      const dummyVec = '[' + new Array(384).fill(0.01).join(',') + ']';
      await db.query(
        `INSERT INTO knowledge_embeddings (id, organization_id, chunk_text, embedding, metadata)
         VALUES ($1, $2, $3, $4::vector, $5)
         ON CONFLICT (id) DO NOTHING`,
        [
          crypto.randomUUID(),
          orgId,
          `Webkorps Service: ${service.name}. ${service.description}. Technologies: ${service.technologies.join(', ')}.`,
          dummyVec,
          JSON.stringify({ category: 'SERVICE', title: service.name, url: 'https://www.webkorps.com/services' })
        ]
      );
      webkorpsCount++;
    }

    // Insert Case Studies
    for (const cs of data.verified_case_studies) {
      await db.query(
        `INSERT INTO knowledge_entities (organization_id, name, entity_type, attributes, source_url, is_verified)
         VALUES ($1, $2, 'CASE_STUDY', $3, 'https://www.webkorps.com/case-studies', TRUE)
         ON CONFLICT DO NOTHING`,
        [orgId, cs.client, JSON.stringify(cs)]
      );
      entitiesCount++;

      const dummyVec = '[' + new Array(384).fill(0.01).join(',') + ']';
      await db.query(
        `INSERT INTO knowledge_embeddings (id, organization_id, chunk_text, embedding, metadata)
         VALUES ($1, $2, $3, $4::vector, $5)
         ON CONFLICT (id) DO NOTHING`,
        [
          crypto.randomUUID(),
          orgId,
          `Webkorps Client Case Study: ${cs.client} in ${cs.industry}. Challenge: ${cs.challenge}. Solution Delivered: ${cs.solution}.`,
          dummyVec,
          JSON.stringify({ category: 'CASE_STUDY', title: `${cs.client} Case Study`, url: 'https://www.webkorps.com/case-studies' })
        ]
      );
      webkorpsCount++;
    }
  }

  // 2. Ingest IT Services Domain Data
  if (fs.existsSync(itServicesPath)) {
    const itData = JSON.parse(fs.readFileSync(itServicesPath, 'utf-8'));

    for (const domain of itData.service_domains) {
      await db.query(
        `INSERT INTO knowledge_entities (organization_id, name, entity_type, attributes, source_url, is_verified)
         VALUES ($1, $2, 'INDUSTRY', $3, 'https://www.webkorps.com/technology', TRUE)
         ON CONFLICT DO NOTHING`,
        [orgId, domain.domain, JSON.stringify(domain)]
      );
      entitiesCount++;

      const dummyVec = '[' + new Array(384).fill(0.01).join(',') + ']';
      await db.query(
        `INSERT INTO knowledge_embeddings (id, organization_id, chunk_text, embedding, metadata)
         VALUES ($1, $2, $3, $4::vector, $5)
         ON CONFLICT (id) DO NOTHING`,
        [
          crypto.randomUUID(),
          orgId,
          `IT Services Architectural Domain: ${domain.domain}. Patterns: ${JSON.stringify(domain.architectural_patterns || domain.best_practices || domain.compliance_frameworks)}.`,
          dummyVec,
          JSON.stringify({ category: 'IT_STANDARDS', title: domain.domain, url: 'https://www.webkorps.com/technology' })
        ]
      );
      itCount++;
    }
  }

  console.log(`✅ Ingestion Complete: ${webkorpsCount} Webkorps chunks, ${itCount} IT Services chunks, ${entitiesCount} entities updated.`);

  return {
    webkorpsChunksInserted: webkorpsCount,
    itServicesChunksInserted: itCount,
    entitiesUpdated: entitiesCount
  };
}
