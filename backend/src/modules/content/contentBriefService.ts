import { db } from '../../db/client.js';
import { AuditLogger } from '../audit/auditLogger.js';
import { KnowledgeService } from '../knowledge/knowledgeService.js';
import { ResearchService } from '../research/researchService.js';
import { ContentProjectService } from './contentProjectService.js';
import createHttpError from 'http-errors';
import type { ContentBrief, ContentOutlineSection, ContentType } from './contentTypes.js';

export interface GenerateBriefInput {
  organizationId: string;
  contentProjectId: string;
  contentGoal?: string;
  customAudience?: string;
}

export class ContentBriefService {
  /**
   * Generates or recalculates a comprehensive, evidence-grounded content brief.
   * Completely idempotent: updates the existing brief for the project if one already exists.
   */
  public static async generateBrief(
    optionsOrOrgId: GenerateBriefInput | string,
    maybeProjectId?: string
  ): Promise<ContentBrief> {
    const organizationId = typeof optionsOrOrgId === 'string' ? optionsOrOrgId : optionsOrOrgId.organizationId;
    const contentProjectId = typeof optionsOrOrgId === 'string' ? maybeProjectId! : optionsOrOrgId.contentProjectId;
    const contentGoal = typeof optionsOrOrgId === 'object' ? optionsOrOrgId.contentGoal : undefined;
    const customAudience = typeof optionsOrOrgId === 'object' ? optionsOrOrgId.customAudience : undefined;

    const project = await ContentProjectService.getProjectById(organizationId, contentProjectId);

    // 1. Load Organization Knowledge Graph Ground Truth
    const kgServices = await KnowledgeService.getEntities(organizationId, 'SERVICE');
    const kgCompany = await KnowledgeService.getEntities(organizationId, 'COMPANY');
    const companyName = kgCompany[0]?.name || 'Webkorps';

    // 2. Load Real Website Pages for Internal Linking
    const pagesRes = await db.query(
      `SELECT p.url, p.title 
       FROM pages p
       JOIN websites w ON w.id = p.website_id
       WHERE w.organization_id = $1 AND w.is_primary = true
       LIMIT 10`,
      [organizationId]
    );
    const internalLinks = pagesRes.rows.map(p => ({
      url: p.url,
      title: p.title || 'Company Resource',
      anchorSuggestion: (p.title || 'Learn more').replace(/\s*\|.*$/, '').trim()
    }));

    // 3. Load Competitor Intelligence & Gaps
    const compRes = await db.query(
      `SELECT name, core_capabilities FROM competitors WHERE organization_id = $1 AND status = 'ACTIVE' LIMIT 5`,
      [organizationId]
    );
    const competitorGaps = compRes.rows.map(c => ({
      competitorName: c.name,
      gapDescription: `Competitor emphasizes: ${(c.core_capabilities || []).slice(0, 3).join(', ')}`
    }));

    // 4. Gather Authoritative Research Evidence via Phase 3 ResearchService
    let evidenceSources: any[] = [];
    try {
      const qRes = await ResearchService.queueResearch({
        query: project.target_keyword,
        organizationId,
        limit: 4
      });
      await ResearchService.executeResearchWorker(qRes.researchSessionId, organizationId, project.target_keyword, qRes.route, 4);
      const sources = await ResearchService.getSessionSources(organizationId, qRes.researchSessionId);
      evidenceSources = sources.map((s: any) => ({
        sourceId: s.id,
        title: s.title,
        url: s.url,
        snippet: s.snippet || '',
        tier: s.quality_tier || s.qualityTier
      }));
    } catch {
      // Graceful fallback to existing research_sources in DB
      const dbSources = await db.query(
        `SELECT id, title, url, snippet, quality_tier FROM research_sources WHERE organization_id = $1 LIMIT 4`,
        [organizationId]
      );
      evidenceSources = dbSources.rows.map((s: any) => ({
        sourceId: s.id,
        title: s.title,
        url: s.url,
        snippet: s.snippet || '',
        tier: s.quality_tier
      }));
    }

    // 5. Structure Outline tailored to Content Type
    const outline = this.buildTailoredOutline(project.content_type, project.title, project.target_keyword, companyName);

    // 6. Secondary Keywords & FAQ Questions
    const secondaryKeywords = [
      `${project.target_keyword} best practices`,
      `${project.target_keyword} architecture`,
      `enterprise ${project.target_keyword}`
    ];

    const questionsToAnswer = [
      `What is ${project.target_keyword} and why is it critical for enterprise scalability?`,
      `How does ${companyName} approach ${project.target_keyword}?`,
      `What are key architectural considerations when implementing ${project.target_keyword}?`
    ];

    const factRequirements = [
      `Company name is ${companyName}.`,
      `Verified core capabilities: ${kgServices.slice(0, 4).map(s => s.name).join(', ')}.`,
      `Do not state unverified headcount, client testimonials, or pricing unless explicit in approved evidence.`
    ];

    // Check for existing brief (Idempotent update)
    const existingBriefRes = await db.query(
      `SELECT id FROM content_briefs WHERE content_project_id = $1 AND organization_id = $2`,
      [contentProjectId, organizationId]
    );

    let briefId: string;
    let briefRecord: any;

    const goal = contentGoal || `Establish authoritative presence and AI discoverability for '${project.target_keyword}'.`;
    const audience = customAudience || project.audience || 'Enterprise Decision Makers';

    if (existingBriefRes.rows.length > 0) {
      briefId = existingBriefRes.rows[0].id;
      const updateRes = await db.query(
        `UPDATE content_briefs 
         SET primary_keyword = $1,
             secondary_keywords = $2,
             content_goal = $3,
             target_audience = $4,
             search_intent = $5,
             primary_topic = $6,
             secondary_topics = $7,
             questions_to_answer = $8,
             recommended_outline = $9,
             competitor_gaps = $10,
             differentiation = $11,
             evidence_sources = $12,
             internal_links = $13,
             external_references = $14,
             seo_requirements = $15,
             geo_requirements = $16,
             call_to_action = $17,
             fact_requirements = $18,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $19 AND organization_id = $20
         RETURNING *`,
        [
          project.target_keyword,
          secondaryKeywords,
          goal,
          audience,
          project.search_intent || 'INFORMATIONAL',
          project.topic || project.title,
          secondaryKeywords,
          questionsToAnswer,
          JSON.stringify(outline),
          JSON.stringify(competitorGaps),
          `${companyName}'s end-to-end engineering rigor and verified competencies in ${kgServices.slice(0, 3).map(s => s.name).join(', ')}.`,
          JSON.stringify(evidenceSources),
          JSON.stringify(internalLinks),
          JSON.stringify(evidenceSources.map(s => ({ url: s.url, title: s.title }))),
          JSON.stringify({ minWordCount: 1200, recommendedWordCount: 1600, h1Requirement: `Must include exact target keyword '${project.target_keyword}'` }),
          JSON.stringify({ entityDefinitionRequired: true, faqIncluded: true, structuredSummaryRequired: true }),
          `Contact ${companyName}'s engineering leadership to schedule a technical consultation.`,
          factRequirements,
          briefId,
          organizationId
        ]
      );
      briefRecord = updateRes.rows[0];
    } else {
      const insertRes = await db.query(
        `INSERT INTO content_briefs 
         (organization_id, content_project_id, primary_keyword, secondary_keywords, content_goal, target_audience, search_intent, primary_topic, secondary_topics, questions_to_answer, recommended_outline, competitor_gaps, differentiation, evidence_sources, internal_links, external_references, seo_requirements, geo_requirements, call_to_action, fact_requirements)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
         RETURNING *`,
        [
          organizationId,
          contentProjectId,
          project.target_keyword,
          secondaryKeywords,
          goal,
          audience,
          project.search_intent || 'INFORMATIONAL',
          project.topic || project.title,
          secondaryKeywords,
          questionsToAnswer,
          JSON.stringify(outline),
          JSON.stringify(competitorGaps),
          `${companyName}'s end-to-end engineering rigor and verified competencies in ${kgServices.slice(0, 3).map(s => s.name).join(', ')}.`,
          JSON.stringify(evidenceSources),
          JSON.stringify(internalLinks),
          JSON.stringify(evidenceSources.map(s => ({ url: s.url, title: s.title }))),
          JSON.stringify({ minWordCount: 1200, recommendedWordCount: 1600, h1Requirement: `Must include exact target keyword '${project.target_keyword}'` }),
          JSON.stringify({ entityDefinitionRequired: true, faqIncluded: true, structuredSummaryRequired: true }),
          `Contact ${companyName}'s engineering leadership to schedule a technical consultation.`,
          factRequirements
        ]
      );
      briefRecord = insertRes.rows[0];
    }

    // Update Project Status to BRIEF_READY
    await db.query(`UPDATE content_projects SET status = 'BRIEF_READY', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [contentProjectId]);

    await AuditLogger.log({
      organizationId,
      action: 'CONTENT_BRIEF_GENERATED',
      entityType: 'CONTENT_BRIEF',
      entityId: briefRecord.id,
      details: { projectId: contentProjectId, keyword: project.target_keyword }
    });

    return briefRecord;
  }

  public static async getBriefByProjectId(organizationId: string, projectId: string): Promise<ContentBrief> {
    const res = await db.query(
      `SELECT * FROM content_briefs WHERE content_project_id = $1 AND organization_id = $2`,
      [projectId, organizationId]
    );
    if (res.rows.length === 0) {
      throw createHttpError(404, 'Content brief not found for this project.');
    }
    return res.rows[0];
  }

  public static async getBriefById(organizationId: string, briefId: string): Promise<ContentBrief> {
    const res = await db.query(
      `SELECT * FROM content_briefs WHERE id = $1 AND organization_id = $2`,
      [briefId, organizationId]
    );
    if (res.rows.length === 0) {
      throw createHttpError(404, 'Content brief not found.');
    }
    return res.rows[0];
  }

  private static buildTailoredOutline(type: ContentType, title: string, keyword: string, company: string): ContentOutlineSection[] {
    if (type === 'SERVICE_PAGE') {
      return [
        { heading: title, level: 'h1', purpose: 'Introduce core service capability and value proposition' },
        { heading: 'Overview & Enterprise Architecture', level: 'h2', purpose: 'Define technical stack and deployment model' },
        { heading: 'Key Capabilities & Technical Deliverables', level: 'h2', purpose: 'Detailed breakdown of core features' },
        { heading: 'Why Partner with ' + company, level: 'h2', purpose: 'Verified proof points, engineering culture, and competitive differentiation' },
        { heading: 'Frequently Asked Questions', level: 'h2', purpose: 'Direct answers structured for GEO entity retrieval' },
        { heading: 'Schedule an Architectural Consultation', level: 'h3', purpose: 'Conversion call to action' }
      ];
    } else if (type === 'COMPARISON') {
      return [
        { heading: title, level: 'h1', purpose: 'Objective side-by-side comparison framework' },
        { heading: 'Market Context & Decision Criteria', level: 'h2', purpose: 'What architectural choices matter most' },
        { heading: 'Feature-by-Feature Technical Matrix', level: 'h2', purpose: 'Structured tabular comparison' },
        { heading: 'When to Choose ' + company, level: 'h2', purpose: 'Clear enterprise fit scenarios' },
        { heading: 'Frequently Asked Questions', level: 'h2', purpose: 'Address common buying questions' }
      ];
    } else {
      // Default BLOG / RESOURCE
      return [
        { heading: title, level: 'h1', purpose: 'Engaging title establishing core topic and search intent' },
        { heading: 'Executive Summary & Key Takeaways', level: 'h2', purpose: 'Immediate factual summary for rapid entity parsing' },
        { heading: 'The Architecture of ' + keyword, level: 'h2', purpose: 'In-depth technical breakdown and industry context' },
        { heading: 'Common Implementation Pitfalls', level: 'h2', purpose: 'Addressing real-world challenges with evidence' },
        { heading: 'Enterprise Best Practices and Roadmap', level: 'h2', purpose: 'Strategic guidance and actionable methodologies' },
        { heading: 'Frequently Asked Questions', level: 'h2', purpose: 'Structured FAQ section addressing user queries' }
      ];
    }
  }
}
