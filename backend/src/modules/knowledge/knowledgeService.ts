import { db } from '../../db/client.js';
import { defaultEmbeddingProvider } from '../../providers/embedding/localEmbedding.provider.js';
import { webkorpsGroundTruth, WEBKORPS_ORGANIZATION_ID } from './webkorpsSeed.js';
import { AuditLogger } from '../audit/auditLogger.js';

export interface CreateEntityInput {
  organizationId: string;
  entityType:
    | 'COMPANY'
    | 'SERVICE'
    | 'INDUSTRY'
    | 'TECHNOLOGY'
    | 'CAPABILITY'
    | 'OFFICE'
    | 'LEADER'
    | 'CLIENT'
    | 'PARTNER'
    | 'CASE_STUDY'
    | 'CERTIFICATION'
    | 'EVENT'
    | 'BLOG'
    | 'FAQ'
    | 'CLAIM';
  name: string;
  attributes?: Record<string, any>;
  sourceUrl?: string;
  sourceType?: 'OFFICIAL_WEBSITE' | 'OFFICIAL_DOCUMENT' | 'CURATED_COMPANY_DATA' | 'CRAWLED_WEBSITE' | 'EXTERNAL_RESEARCH' | 'MANUAL_ENTRY';
  confidence?: 'VERIFIED' | 'HIGH_CONFIDENCE' | 'SUPPORTED' | 'DISCOVERED' | 'UNKNOWN';
  verificationStatus?: 'VERIFIED' | 'HIGH_CONFIDENCE' | 'SUPPORTED' | 'DISCOVERED' | 'UNKNOWN';
}

export class KnowledgeService {
  /**
   * Seeds the comprehensive Webkorps ground-truth Knowledge Graph into PostgreSQL
   */
  public static async seedWebkorpsGroundTruth(forceReseed = false): Promise<void> {
    // 1. Ensure Webkorps Organization exists
    await db.query(
      `INSERT INTO organizations (id, name, slug, tier)
       VALUES ($1, $2, 'webkorps', 'ENTERPRISE')
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name`,
      [WEBKORPS_ORGANIZATION_ID, webkorpsGroundTruth.name]
    );

    // Check if entities already seeded (check count > 20 for full graph)
    const countRes = await db.query(
      `SELECT count(*) as count FROM knowledge_entities WHERE organization_id = $1`,
      [WEBKORPS_ORGANIZATION_ID]
    );
    if (!forceReseed && parseInt(countRes.rows[0].count, 10) >= 30) {
      return;
    }

    // Clean existing seed if reseeding
    if (forceReseed) {
      await db.query(`DELETE FROM knowledge_entities WHERE organization_id = $1`, [WEBKORPS_ORGANIZATION_ID]);
    }

    console.log('[Knowledge Graph] Seeding Webkorps comprehensive authoritative graph into PostgreSQL...');

    // 2. Insert Company Entity
    const companyRes = await db.query(
      `INSERT INTO knowledge_entities (
         organization_id, entity_type, name, attributes, source_url,
         source_type, confidence, verification_status
       )
       VALUES ($1, 'COMPANY', $2, $3, $4, 'CURATED_COMPANY_DATA', 'VERIFIED', 'VERIFIED') RETURNING id`,
      [
        WEBKORPS_ORGANIZATION_ID,
        webkorpsGroundTruth.name,
        JSON.stringify({
          legalName: webkorpsGroundTruth.legalName,
          foundedYear: webkorpsGroundTruth.foundedYear,
          yearsInBusiness: webkorpsGroundTruth.yearsInBusiness,
          teamSize: webkorpsGroundTruth.teamSize,
          overview: webkorpsGroundTruth.overview,
          positioning: webkorpsGroundTruth.positioning,
          differentiators: webkorpsGroundTruth.differentiators,
          socialProfiles: webkorpsGroundTruth.socialProfiles
        }),
        webkorpsGroundTruth.url
      ]
    );
    const companyId = companyRes.rows[0].id;
    await this.createEmbedding(
      WEBKORPS_ORGANIZATION_ID,
      companyId,
      `Webkorps is an enterprise digital engineering firm founded in 2014 with 400+ engineers delivering mobile, web, cloud, and AI solutions.`
    );

    // 3. Insert Headquarters & Global Offices
    const hqRes = await db.query(
      `INSERT INTO knowledge_entities (organization_id, entity_type, name, attributes, source_type, confidence, verification_status)
       VALUES ($1, 'OFFICE', $2, $3, 'CURATED_COMPANY_DATA', 'VERIFIED', 'VERIFIED') RETURNING id`,
      [
        WEBKORPS_ORGANIZATION_ID,
        `HQ Indore (${webkorpsGroundTruth.headquarters.city})`,
        JSON.stringify(webkorpsGroundTruth.headquarters)
      ]
    );
    await this.createRelation(WEBKORPS_ORGANIZATION_ID, companyId, 'HEADQUARTERED_AT', hqRes.rows[0].id);

    for (const office of webkorpsGroundTruth.globalOffices) {
      const offRes = await db.query(
        `INSERT INTO knowledge_entities (organization_id, entity_type, name, attributes, source_type, confidence, verification_status)
         VALUES ($1, 'OFFICE', $2, $3, 'CURATED_COMPANY_DATA', 'VERIFIED', 'VERIFIED') RETURNING id`,
        [WEBKORPS_ORGANIZATION_ID, `Office ${office.city}`, JSON.stringify(office)]
      );
      await this.createRelation(WEBKORPS_ORGANIZATION_ID, companyId, 'HAS_OFFICE', offRes.rows[0].id);
    }

    // 4. Insert Leadership
    for (const leader of webkorpsGroundTruth.leadership) {
      const leadRes = await db.query(
        `INSERT INTO knowledge_entities (organization_id, entity_type, name, attributes, source_type, confidence, verification_status)
         VALUES ($1, 'LEADER', $2, $3, 'CURATED_COMPANY_DATA', 'VERIFIED', 'VERIFIED') RETURNING id`,
        [WEBKORPS_ORGANIZATION_ID, leader.name, JSON.stringify(leader)]
      );
      await this.createRelation(WEBKORPS_ORGANIZATION_ID, companyId, 'LED_BY', leadRes.rows[0].id);
      await this.createEmbedding(
        WEBKORPS_ORGANIZATION_ID,
        leadRes.rows[0].id,
        `${leader.name} is ${leader.role} at Webkorps. Quote: ${leader.quote}`
      );
    }

    // 5. Insert Capabilities
    const capabilityMap: Record<string, string> = {};
    for (const cap of webkorpsGroundTruth.capabilities) {
      const capRes = await db.query(
        `INSERT INTO knowledge_entities (organization_id, entity_type, name, attributes, source_type, confidence, verification_status)
         VALUES ($1, 'CAPABILITY', $2, $3, 'CURATED_COMPANY_DATA', 'VERIFIED', 'VERIFIED') RETURNING id`,
        [WEBKORPS_ORGANIZATION_ID, cap.name, JSON.stringify(cap)]
      );
      const capId = capRes.rows[0].id;
      capabilityMap[cap.name] = capId;
      await this.createRelation(WEBKORPS_ORGANIZATION_ID, companyId, 'PROVIDES', capId);
      await this.createEmbedding(
        WEBKORPS_ORGANIZATION_ID,
        capId,
        `Webkorps capability in ${cap.name}: ${cap.description}`
      );
    }

    // 6. Insert Technologies
    const technologyMap: Record<string, string> = {};
    for (const tech of webkorpsGroundTruth.technologies) {
      const techRes = await db.query(
        `INSERT INTO knowledge_entities (organization_id, entity_type, name, attributes, source_type, confidence, verification_status)
         VALUES ($1, 'TECHNOLOGY', $2, $3, 'CURATED_COMPANY_DATA', 'VERIFIED', 'VERIFIED') RETURNING id`,
        [WEBKORPS_ORGANIZATION_ID, tech.name, JSON.stringify(tech)]
      );
      const techId = techRes.rows[0].id;
      technologyMap[tech.name] = techId;
      await this.createRelation(WEBKORPS_ORGANIZATION_ID, companyId, 'USES', techId);
      await this.createEmbedding(
        WEBKORPS_ORGANIZATION_ID,
        techId,
        `Technology ${tech.name} (${tech.category}): ${tech.description}. Verified Webkorps engineering stack.`
      );
    }

    // 7. Insert Core Services and Wire Relations to Technologies & Capabilities
    const serviceMap: Record<string, string> = {};
    for (const service of webkorpsGroundTruth.coreServices) {
      const srvRes = await db.query(
        `INSERT INTO knowledge_entities (organization_id, entity_type, name, attributes, source_type, confidence, verification_status)
         VALUES ($1, 'SERVICE', $2, $3, 'CURATED_COMPANY_DATA', 'VERIFIED', 'VERIFIED') RETURNING id`,
        [WEBKORPS_ORGANIZATION_ID, service.name, JSON.stringify(service)]
      );
      const srvId = srvRes.rows[0].id;
      serviceMap[service.name] = srvId;
      await this.createRelation(WEBKORPS_ORGANIZATION_ID, companyId, 'PROVIDES', srvId);

      // Link Service -> USES -> Technology
      for (const tName of service.technologies) {
        if (technologyMap[tName]) {
          await this.createRelation(WEBKORPS_ORGANIZATION_ID, srvId, 'USES', technologyMap[tName]);
        }
      }

      // Link Service -> SUPPORTS -> Capability
      for (const cName of service.capabilities) {
        if (capabilityMap[cName]) {
          await this.createRelation(WEBKORPS_ORGANIZATION_ID, srvId, 'SUPPORTS', capabilityMap[cName]);
        }
      }

      // Generate embedding for service
      await this.createEmbedding(
        WEBKORPS_ORGANIZATION_ID,
        srvId,
        `Webkorps provides ${service.name}. ${service.description} Technologies: ${service.technologies.join(', ')}.`
      );
    }

    // 8. Insert Target Industries
    const industryMap: Record<string, string> = {};
    for (const industry of webkorpsGroundTruth.targetIndustries) {
      const indRes = await db.query(
        `INSERT INTO knowledge_entities (organization_id, entity_type, name, attributes, source_type, confidence, verification_status)
         VALUES ($1, 'INDUSTRY', $2, $3, 'CURATED_COMPANY_DATA', 'VERIFIED', 'VERIFIED') RETURNING id`,
        [WEBKORPS_ORGANIZATION_ID, industry.name, JSON.stringify(industry)]
      );
      const indId = indRes.rows[0].id;
      industryMap[industry.name] = indId;
      await this.createRelation(WEBKORPS_ORGANIZATION_ID, companyId, 'SERVES', indId);

      // Link relevant services
      if (industry.name.includes('Logistics')) {
        if (serviceMap['Mobile App Development']) await this.createRelation(WEBKORPS_ORGANIZATION_ID, serviceMap['Mobile App Development'], 'SERVES', indId);
        if (serviceMap['Custom Software Development']) await this.createRelation(WEBKORPS_ORGANIZATION_ID, serviceMap['Custom Software Development'], 'SERVES', indId);
        if (serviceMap['Cloud & DevOps Engineering']) await this.createRelation(WEBKORPS_ORGANIZATION_ID, serviceMap['Cloud & DevOps Engineering'], 'SERVES', indId);
      }

      // Generate embedding for industry
      await this.createEmbedding(
        WEBKORPS_ORGANIZATION_ID,
        indId,
        `Webkorps industry solutions for ${industry.name}: Features: ${industry.relevantFeatures.join(', ')}. Stack: ${industry.recommendedStack.join(', ')}. ${industry.webkorpsCapabilities}`
      );
    }

    // 9. Insert Certifications
    for (const cert of webkorpsGroundTruth.certifications) {
      const certRes = await db.query(
        `INSERT INTO knowledge_entities (organization_id, entity_type, name, source_type, confidence, verification_status)
         VALUES ($1, 'CERTIFICATION', $2, 'CURATED_COMPANY_DATA', 'VERIFIED', 'VERIFIED') RETURNING id`,
        [WEBKORPS_ORGANIZATION_ID, cert]
      );
      await this.createRelation(WEBKORPS_ORGANIZATION_ID, companyId, 'HAS_CERTIFICATION', certRes.rows[0].id);
    }

    // 10. Insert Key Case Studies
    for (const cs of webkorpsGroundTruth.caseStudies) {
      const csRes = await db.query(
        `INSERT INTO knowledge_entities (organization_id, entity_type, name, attributes, source_type, confidence, verification_status)
         VALUES ($1, 'CASE_STUDY', $2, $3, 'CURATED_COMPANY_DATA', 'VERIFIED', 'VERIFIED') RETURNING id`,
        [WEBKORPS_ORGANIZATION_ID, cs.name, JSON.stringify(cs)]
      );
      const csId = csRes.rows[0].id;
      await this.createRelation(WEBKORPS_ORGANIZATION_ID, companyId, 'HAS_CASE_STUDY', csId);

      if (industryMap[cs.industry]) {
        await this.createRelation(WEBKORPS_ORGANIZATION_ID, csId, 'RELEVANT_TO', industryMap[cs.industry]);
      }

      for (const techName of cs.technologies) {
        if (technologyMap[techName]) {
          await this.createRelation(WEBKORPS_ORGANIZATION_ID, csId, 'USES', technologyMap[techName]);
        }
      }

      await this.createEmbedding(
        WEBKORPS_ORGANIZATION_ID,
        csId,
        `Case study: ${cs.name} for ${cs.client}. Industry: ${cs.industry}. Solution: ${cs.solution} Outcomes: ${cs.outcomes} Tech: ${cs.technologies.join(', ')}`
      );
    }

    // 11. Insert FAQs
    for (const faq of webkorpsGroundTruth.faqs) {
      const faqRes = await db.query(
        `INSERT INTO knowledge_entities (organization_id, entity_type, name, attributes, source_type, confidence, verification_status)
         VALUES ($1, 'FAQ', $2, $3, 'CURATED_COMPANY_DATA', 'VERIFIED', 'VERIFIED') RETURNING id`,
        [WEBKORPS_ORGANIZATION_ID, faq.question, JSON.stringify(faq)]
      );
      await this.createEmbedding(
        WEBKORPS_ORGANIZATION_ID,
        faqRes.rows[0].id,
        `FAQ Question: ${faq.question} Answer: ${faq.answer}`
      );
    }

    console.log('[Knowledge Graph] Webkorps authoritative ground-truth graph and embeddings seeded successfully.');
  }

  public static async createEntity(input: CreateEntityInput): Promise<any> {
    const res = await db.query(
      `INSERT INTO knowledge_entities (
         organization_id, entity_type, name, attributes, source_url,
         source_type, confidence, verification_status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        input.organizationId,
        input.entityType,
        input.name,
        JSON.stringify(input.attributes || {}),
        input.sourceUrl || null,
        input.sourceType || 'CURATED_COMPANY_DATA',
        input.confidence || 'VERIFIED',
        input.verificationStatus || 'VERIFIED'
      ]
    );

    const entity = res.rows[0];

    // Auto-embed entity description
    const textToEmbed = `${entity.entity_type}: ${entity.name}. ${JSON.stringify(input.attributes || {})}`;
    await this.createEmbedding(input.organizationId, entity.id, textToEmbed, {
      entity_type: entity.entity_type,
      verification_status: entity.verification_status
    });

    await AuditLogger.log({
      organizationId: input.organizationId,
      action: 'CREATE_KNOWLEDGE_ENTITY',
      entityType: 'KNOWLEDGE_ENTITY',
      entityId: entity.id,
      details: { name: entity.name, type: entity.entity_type }
    });

    return entity;
  }

  public static async createRelation(
    organizationId: string,
    fromEntityId: string,
    relationType: string,
    toEntityId: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    const res = await db.query(
      `INSERT INTO knowledge_relations (organization_id, from_entity_id, relation_type, to_entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [organizationId, fromEntityId, relationType, toEntityId, JSON.stringify(metadata || {})]
    );
    return res.rows[0];
  }

  public static async createEmbedding(
    organizationId: string,
    entityId: string,
    chunkText: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    const vectorArray = await defaultEmbeddingProvider.generateEmbedding(chunkText);
    const vectorString = '[' + vectorArray.join(',') + ']';

    const res = await db.query(
      `INSERT INTO knowledge_embeddings (organization_id, entity_id, chunk_text, embedding, metadata)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, organization_id, entity_id, chunk_text, created_at`,
      [organizationId, entityId, chunkText, vectorString, JSON.stringify(metadata || {})]
    );
    return res.rows[0];
  }

  /**
   * Semantic Vector Search strictly isolated by organization_id
   */
  public static async searchSemantic(
    organizationId: string,
    queryText: string,
    limit = 5
  ): Promise<any[]> {
    const queryVector = await defaultEmbeddingProvider.generateEmbedding(queryText);
    const vectorString = '[' + queryVector.join(',') + ']';

    const res = await db.query(
      `SELECT em.id as embedding_id, em.chunk_text, (em.embedding <-> $1) AS distance,
              e.id as entity_id, e.entity_type, e.name, e.attributes, e.source_type, e.confidence, e.verification_status
       FROM knowledge_embeddings em
       LEFT JOIN knowledge_entities e ON em.entity_id = e.id
       WHERE em.organization_id = $2
       ORDER BY distance ASC
       LIMIT $3`,
      [vectorString, organizationId, limit]
    );
    return res.rows;
  }

  public static async getEntities(organizationId: string, entityType?: string): Promise<any[]> {
    if (entityType) {
      const res = await db.query(
        `SELECT * FROM knowledge_entities WHERE organization_id = $1 AND entity_type = $2 ORDER BY name ASC`,
        [organizationId, entityType]
      );
      return res.rows;
    }
    const res = await db.query(
      `SELECT * FROM knowledge_entities WHERE organization_id = $1 ORDER BY entity_type, name ASC`,
      [organizationId]
    );
    return res.rows;
  }

  public static async getRelations(organizationId: string): Promise<any[]> {
    const res = await db.query(
      `SELECT r.*, f.name as from_name, f.entity_type as from_type, t.name as to_name, t.entity_type as to_type
       FROM knowledge_relations r
       JOIN knowledge_entities f ON r.from_entity_id = f.id
       JOIN knowledge_entities t ON r.to_entity_id = t.id
       WHERE r.organization_id = $1`,
      [organizationId]
    );
    return res.rows;
  }

  public static async getEntityRelations(organizationId: string, entityId: string): Promise<any[]> {
    const res = await db.query(
      `SELECT r.*, f.name as from_name, f.entity_type as from_type, t.name as to_name, t.entity_type as to_type
       FROM knowledge_relations r
       JOIN knowledge_entities f ON r.from_entity_id = f.id
       JOIN knowledge_entities t ON r.to_entity_id = t.id
       WHERE r.organization_id = $1 AND (r.from_entity_id = $2 OR r.to_entity_id = $2)`,
      [organizationId, entityId]
    );
    return res.rows;
  }
}

