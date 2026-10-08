import { db } from '../../db/client.js';
import type { ExtractedPageData } from './htmlExtractor.js';

export class KnowledgeCandidateExtractor {
  public static async processCandidates(
    organizationId: string,
    pageUrl: string,
    data: ExtractedPageData
  ): Promise<number> {
    let candidateCount = 0;

    // 1. Extract from JSON-LD Schema
    for (const schema of data.schemas) {
      const type = schema['@type'];
      const name = schema.name || schema.legalName;

      if (name && typeof name === 'string' && name.trim().length > 2) {
        let entityType: any = null;
        if (type === 'Organization' || type === 'Corporation') entityType = 'COMPANY';
        else if (type === 'Service' || type === 'ServiceChannel') entityType = 'SERVICE';
        else if (type === 'LocalBusiness' || type === 'Place') entityType = 'OFFICE';
        else if (type === 'Person') entityType = 'LEADER';
        else if (type === 'Article' || type === 'BlogPosting') entityType = 'BLOG';

        if (entityType) {
          const inserted = await this.saveCandidate(organizationId, entityType, name.trim(), schema, pageUrl);
          if (inserted) candidateCount++;
        }
      }
    }

    // 2. Discover Services from H2 headings on /services or /solutions pages
    const lowerUrl = pageUrl.toLowerCase();
    if (lowerUrl.includes('service') || lowerUrl.includes('solution') || lowerUrl.includes('capabilities')) {
      for (const h2 of data.h2Tags) {
        if (h2.length >= 4 && h2.length <= 60 && !h2.includes('?') && !h2.toLowerCase().includes('why')) {
          const inserted = await this.saveCandidate(
            organizationId,
            'SERVICE',
            h2,
            { discoveredHeadingLevel: 'h2' },
            pageUrl
          );
          if (inserted) candidateCount++;
        }
      }
    }

    return candidateCount;
  }

  private static async saveCandidate(
    organizationId: string,
    entityType: string,
    name: string,
    attributes: Record<string, any>,
    sourceUrl: string
  ): Promise<boolean> {
    try {
      // Check if entity already exists as AUTHORITATIVE or DISCOVERED
      const existing = await db.query(
        `SELECT id, verification_status FROM knowledge_entities
         WHERE organization_id = $1 AND LOWER(name) = LOWER($2)`,
        [organizationId, name]
      );

      if (existing.rows.length > 0) {
        // Do NOT overwrite existing authoritative ground truth!
        return false;
      }

      await db.query(
        `INSERT INTO knowledge_entities (
           organization_id, entity_type, name, attributes, source_url,
           is_verified, verification_status, source_type, confidence, discovery_source_url
         )
         VALUES ($1, $2, $3, $4, $5, FALSE, 'DISCOVERED', 'CRAWLED_WEBSITE', 'DISCOVERED', $5)`,
        [organizationId, entityType, name, JSON.stringify(attributes), sourceUrl]
      );
      return true;
    } catch {
      return false;
    }
  }
}

