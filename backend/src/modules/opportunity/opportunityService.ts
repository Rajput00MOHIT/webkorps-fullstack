import { db } from '../../db/client.js';
import { OpportunityScorer } from './opportunityScorer.js';
import { AuditLogger } from '../audit/auditLogger.js';
import createHttpError from 'http-errors';
import type {
  Opportunity,
  OpportunityType,
  OpportunityPriority,
  OpportunityStatus,
  OpportunityEffort,
  OpportunityEvidence,
  OpportunitySummary
} from './opportunityTypes.js';

interface RawCandidateOpportunity {
  type: OpportunityType;
  title: string;
  description: string;
  problemStatement?: string;
  recommendedAction?: string;
  impact: number;
  confidence: number;
  effort: OpportunityEffort;
  entityId?: string;
  competitorId?: string;
  query?: string;
  dedupKey: string;
  evidenceItems: Array<{
    type: 'AI_OBSERVATION' | 'CRAWL_ISSUE' | 'RESEARCH_SOURCE' | 'KNOWLEDGE_GAP' | 'COMPETITOR_SIGNAL';
    title: string;
    snippet?: string;
    url?: string;
    referenceId?: string;
    confidence?: number;
  }>;
}

export class OpportunityService {
  /**
   * Generates or recalculates evidence-backed opportunities from:
   * 1. Knowledge Graph entities
   * 2. Website Crawl intelligence & SEO issues
   * 3. Research evidence
   * 4. AI visibility observations & citations
   * 5. Competitor intelligence
   *
   * Completely idempotent: repeated runs update existing open opportunities without duplicating.
   */
  public static async generateOpportunities(organizationId: string): Promise<Opportunity[]> {
    const candidateList: RawCandidateOpportunity[] = [];

    // 1. Fetch Primary Website
    const primaryWebRes = await db.query(
      `SELECT id, domain FROM websites WHERE organization_id = $1 AND is_primary = true LIMIT 1`,
      [organizationId]
    );
    const primaryWebsite = primaryWebRes.rows[0];
    const websiteId = primaryWebsite?.id;

    // 2. Fetch Crawl Pages & SEO Issues for Primary Website
    let crawledPages: any[] = [];
    let seoIssues: any[] = [];
    if (websiteId) {
      const pRes = await db.query(
        `SELECT url, title, meta_description FROM pages WHERE website_id = $1`,
        [websiteId]
      );
      crawledPages = pRes.rows;

      const iRes = await db.query(
        `SELECT id, issue_type, page_id, recommendation, severity FROM seo_issues WHERE website_id = $1 AND status = 'OPEN'`,
        [websiteId]
      );
      seoIssues = iRes.rows;
    }

    // 3. Fetch Knowledge Graph Services
    const kgServicesRes = await db.query(
      `SELECT id, name, attributes FROM knowledge_entities WHERE organization_id = $1 AND entity_type = 'SERVICE'`,
      [organizationId]
    );
    const kgServices = kgServicesRes.rows;

    // --- GAP 1: Missing Dedicated Service Pages ---
    for (const service of kgServices) {
      const sNameLower = service.name.toLowerCase();
      // Check if any crawled page URL or title specifically covers this service
      const matchingPage = crawledPages.find(p => {
        const urlLower = (p.url || '').toLowerCase();
        const titleLower = (p.title || '').toLowerCase();
        return urlLower.includes(sNameLower.replace(/\s+/g, '-')) || titleLower.includes(sNameLower);
      });

      if (!matchingPage && crawledPages.length > 0) {
        candidateList.push({
          type: 'MISSING_SERVICE_PAGE',
          title: `Missing dedicated service page for '${service.name}'`,
          description: `Knowledge Graph identifies '${service.name}' as an authoritative company service, but no dedicated indexable URL or title exists on the primary website.`,
          problemStatement: `Search engines and AI systems cannot cite a direct canonical landing page for ${service.name}.`,
          recommendedAction: `Publish a dedicated service page at /services/${service.name.toLowerCase().replace(/\s+/g, '-')} with full capability overview and case studies.`,
          impact: 85,
          confidence: 0.95,
          effort: 'MEDIUM',
          entityId: service.id,
          dedupKey: `${organizationId}:MISSING_SERVICE_PAGE:${sNameLower}`,
          evidenceItems: [
            {
              type: 'KNOWLEDGE_GAP',
              title: `Service Entity: ${service.name}`,
              snippet: service.attributes?.description || `Registered service: ${service.name}`,
              referenceId: service.id,
              confidence: 1.0
            }
          ]
        });
      }
    }

    // 4. Fetch Competitors
    const compRes = await db.query(
      `SELECT id, name, domain, core_capabilities FROM competitors WHERE organization_id = $1 AND status != 'ARCHIVED'`,
      [organizationId]
    );
    const competitors = compRes.rows;

    // --- GAP 2: Competitor Topic Coverage Advantage ---
    for (const comp of competitors) {
      const compCaps = comp.core_capabilities || [];
      for (const cap of compCaps) {
        const capLower = cap.toLowerCase();
        const orgHasCap = kgServices.some(s => s.name.toLowerCase().includes(capLower) || capLower.includes(s.name.toLowerCase()));
        if (!orgHasCap) {
          candidateList.push({
            type: 'TOPIC_GAP',
            title: `Competitor topic advantage: '${cap}' offered by ${comp.name}`,
            description: `Competitor ${comp.name} actively positions '${cap}', which is currently absent from organization services and website coverage.`,
            problemStatement: `Potential customers seeking ${cap} will discover and evaluate ${comp.name} rather than Webkorps.`,
            recommendedAction: `Assess market demand for ${cap} and consider adding dedicated solution content or strategic partnerships.`,
            impact: 65,
            confidence: 0.8,
            effort: 'HIGH',
            competitorId: comp.id,
            dedupKey: `${organizationId}:TOPIC_GAP:${comp.name.toLowerCase()}:${capLower}`,
            evidenceItems: [
              {
                type: 'COMPETITOR_SIGNAL',
                title: `Competitor Capability: ${comp.name} - ${cap}`,
                snippet: `Detected in competitor profile for ${comp.domain}`,
                url: comp.domain,
                referenceId: comp.id,
                confidence: 0.85
              }
            ]
          });
        }
      }
    }

    // 5. Fetch AI Observations & Mentions & Citations
    const obsRunsRes = await db.query(
      `SELECT 
          aor.id as run_id,
          vp.id as prompt_id,
          vp.prompt_text,
          aor.raw_response
       FROM ai_observation_runs aor
       JOIN visibility_prompts vp ON vp.id = aor.prompt_id
       WHERE aor.organization_id = $1 AND aor.status = 'COMPLETED'
       ORDER BY aor.completed_at DESC`,
      [organizationId]
    );

    for (const run of obsRunsRes.rows) {
      // Check org mentions
      const orgMentionRes = await db.query(
        `SELECT mentioned, recommendation_signal, mention_context FROM ai_mentions WHERE observation_run_id = $1`,
        [run.run_id]
      );
      const isMentioned = orgMentionRes.rows.some(r => r.mentioned);
      const isRecommended = orgMentionRes.rows.some(r => r.recommendation_signal === true);

      // Check org citations
      const orgCiteRes = await db.query(
        `SELECT cited_url FROM ai_citations WHERE observation_run_id = $1 AND is_target_domain = true`,
        [run.run_id]
      );
      const isCited = orgCiteRes.rows.length > 0;

      // Check competitors in this run
      const compMentionRes = await db.query(
        `SELECT competitor_name, recommendation_signal, context FROM ai_competitor_mentions WHERE observation_run_id = $1 AND mentioned = true`,
        [run.run_id]
      );

      // --- GAP 3: Competitor Cited while Target is Absent ---
      if (!isMentioned && compMentionRes.rows.length > 0) {
        const topComp = compMentionRes.rows[0].competitor_name;
        candidateList.push({
          type: 'COMPETITOR_CITED',
          title: `Competitor recommendation advantage in '${run.prompt_text.slice(0, 50)}...'`,
          description: `Competitor ${topComp} was recognized and recommended in AI response for '${run.prompt_text}', whereas organization was completely omitted.`,
          problemStatement: `Prospective clients querying AI engines for this service encounter competitors with zero brand presence for Webkorps.`,
          recommendedAction: `Develop authoritative, case-study-rich content answering '${run.prompt_text}' and gain relevant industry citations.`,
          impact: 90,
          confidence: 0.95,
          effort: 'MEDIUM',
          query: run.prompt_text,
          dedupKey: `${organizationId}:COMPETITOR_CITED:${topComp.toLowerCase()}:${run.prompt_id}`,
          evidenceItems: [
            {
              type: 'AI_OBSERVATION',
              title: `AI Run: ${run.prompt_text}`,
              snippet: run.raw_response ? run.raw_response.slice(0, 300) : `Competitor ${topComp} recommended in answer`,
              referenceId: run.run_id,
              confidence: 0.95
            }
          ]
        });
      }

      // --- GAP 4: Mentioned but Missing Citation ---
      if (isMentioned && !isCited) {
        candidateList.push({
          type: 'MISSING_CITATION',
          title: `Unlinked brand mention in '${run.prompt_text.slice(0, 50)}...'`,
          description: `Webkorps was mentioned in the AI synthesis for '${run.prompt_text}', but no official website link was cited in the reference list.`,
          problemStatement: `Users reading AI summaries cannot directly click through to verified Webkorps properties.`,
          recommendedAction: `Ensure prominent structured data (Schema.org Organization and sameAs) exists across indexable service pages.`,
          impact: 75,
          confidence: 0.85,
          effort: 'LOW',
          query: run.prompt_text,
          dedupKey: `${organizationId}:MISSING_CITATION:${run.prompt_id}`,
          evidenceItems: [
            {
              type: 'AI_OBSERVATION',
              title: `Unlinked AI Mention in: ${run.prompt_text}`,
              snippet: orgMentionRes.rows[0]?.mention_context || `Mentioned without link citation`,
              referenceId: run.run_id,
              confidence: 0.9
            }
          ]
        });
      }

      // --- GAP 5: Mentioned without Recommendation Signal ---
      if (isMentioned && !isRecommended) {
        candidateList.push({
          type: 'WEAK_EVIDENCE',
          title: `Neutral mention lacking recommendation signal: '${run.prompt_text.slice(0, 50)}...'`,
          description: `Webkorps is listed as an option in '${run.prompt_text}', but lacks definitive superlative markers (e.g., 'top choice', 'industry leader', 'best for AI').`,
          problemStatement: `Competitors with stronger third-party proof points secure the primary endorsement.`,
          recommendedAction: `Publish quantifiable client outcomes and third-party verified ratings for this competency.`,
          impact: 70,
          confidence: 0.8,
          effort: 'MEDIUM',
          query: run.prompt_text,
          dedupKey: `${organizationId}:WEAK_EVIDENCE:${run.prompt_id}`,
          evidenceItems: [
            {
              type: 'AI_OBSERVATION',
              title: `Neutral Mention: ${run.prompt_text}`,
              snippet: orgMentionRes.rows[0]?.mention_context || `Mention lacked recommendation signal`,
              referenceId: run.run_id,
              confidence: 0.8
            }
          ]
        });
      }

      // --- GAP 6: Third-Party Authority Gap ---
      const thirdPartyCites = await db.query(
        `SELECT cited_domain, cited_url FROM ai_citations WHERE observation_run_id = $1 AND is_target_domain = false`,
        [run.run_id]
      );
      if (thirdPartyCites.rows.length > 0 && !isCited) {
        const topDomain = thirdPartyCites.rows[0].cited_domain;
        candidateList.push({
          type: 'AUTHORITY_GAP',
          title: `Third-party authority gap: ${topDomain} cited in AI answer`,
          description: `AI engine retrieved and cited third-party authority source '${topDomain}' to substantiate recommendations for '${run.prompt_text}'.`,
          problemStatement: `Brand absence on key authoritative platforms directly limits AI citation frequency.`,
          recommendedAction: `Establish authoritative presence and profile citations on ${topDomain} or relevant industry review directories.`,
          impact: 80,
          confidence: 0.85,
          effort: 'HIGH',
          query: run.prompt_text,
          dedupKey: `${organizationId}:AUTHORITY_GAP:${topDomain.toLowerCase()}`,
          evidenceItems: [
            {
              type: 'RESEARCH_SOURCE',
              title: `Authoritative Citation Source: ${topDomain}`,
              url: thirdPartyCites.rows[0].cited_url || `https://${topDomain}`,
              snippet: `Cited in AI search answer for query: ${run.prompt_text}`,
              referenceId: run.run_id,
              confidence: 0.9
            }
          ]
        });
      }
    }

    // --- GAP 7: Technical SEO Gaps from Crawl Issues ---
    const issuesByType = new Map<string, any[]>();
    for (const issue of seoIssues) {
      const list = issuesByType.get(issue.issue_type) || [];
      list.push(issue);
      issuesByType.set(issue.issue_type, list);
    }

    for (const [issueType, issues] of issuesByType.entries()) {
      candidateList.push({
        type: 'TECHNICAL_SEO_GAP',
        title: `Resolve ${issues.length} technical crawl issues (${issueType})`,
        description: `Crawler detected ${issues.length} instances of ${issueType} affecting indexability and search visibility on primary website.`,
        problemStatement: `Technical deficiencies impede crawler indexing and lower page authority signals.`,
        recommendedAction: `Update page templates to address ${issueType}: ${issues[0]?.recommendation || 'Fix issue'}.`,
        impact: 65,
        confidence: 0.95,
        effort: 'LOW',
        dedupKey: `${organizationId}:TECHNICAL_SEO_GAP:${issueType.toLowerCase()}`,
        evidenceItems: issues.slice(0, 5).map(i => ({
          type: 'CRAWL_ISSUE',
          title: `SEO Issue: ${i.issue_type}`,
          snippet: i.recommendation || `Severity: ${i.severity}`,
          referenceId: i.id,
          confidence: 1.0
        }))
      });
    }

    // 6. Group by dedupKey and merge evidence items to avoid duplicates
    const grouped = new Map<string, RawCandidateOpportunity>();
    for (const cand of candidateList) {
      const existing = grouped.get(cand.dedupKey);
      if (existing) {
        existing.evidenceItems.push(...cand.evidenceItems);
        existing.impact = Math.max(existing.impact, cand.impact);
      } else {
        grouped.set(cand.dedupKey, cand);
      }
    }

    // 7. Calculate Deterministic Scores and Upsert into Database
    const savedOpportunities: Opportunity[] = [];

    for (const cand of grouped.values()) {
      const scoreObj = OpportunityScorer.calculateScore({
        impact: cand.impact,
        confidence: cand.confidence,
        effort: cand.effort,
        evidenceCount: cand.evidenceItems.length
      });

      // Check existing opportunity with this dedupKey in same org
      const existingOppRes = await db.query(
        `SELECT id, status FROM opportunities WHERE organization_id = $1 AND deduplication_key = $2`,
        [organizationId, cand.dedupKey]
      );

      let oppId: string;
      if (existingOppRes.rows.length > 0) {
        oppId = existingOppRes.rows[0].id;
        // If not dismissed or resolved, update metrics and score
        if (existingOppRes.rows[0].status === 'OPEN' || existingOppRes.rows[0].status === 'IN_REVIEW') {
          const updateRes = await db.query(
            `UPDATE opportunities 
             SET title = $1,
                 description = $2,
                 problem_statement = $3,
                 recommended_action = $4,
                 impact = $5,
                 confidence = $6,
                 effort = $7,
                 score = $8,
                 priority = $9,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $10
             RETURNING *`,
            [
              cand.title,
              cand.description,
              cand.problemStatement || cand.description,
              cand.recommendedAction || cand.description,
              cand.impact,
              cand.confidence,
              cand.effort,
              scoreObj.score,
              scoreObj.priority,
              oppId
            ]
          );
          savedOpportunities.push(updateRes.rows[0]);
        }
      } else {
        const insertRes = await db.query(
          `INSERT INTO opportunities 
           (organization_id, website_id, opportunity_type, title, description, query, problem_statement, recommended_action, status, priority, impact, confidence, effort, score, entity_id, competitor_id, source, deduplication_key, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'OPEN', $9, $10, $11, $12, $13, $14, $15, 'HYBRID_INTELLIGENCE', $16, $17)
           RETURNING *`,
          [
            organizationId,
            websiteId || null,
            cand.type,
            cand.title,
            cand.description,
            cand.query || cand.title,
            cand.problemStatement || null,
            cand.recommendedAction || null,
            scoreObj.priority,
            cand.impact,
            cand.confidence,
            cand.effort,
            scoreObj.score,
            cand.entityId || null,
            cand.competitorId || null,
            cand.dedupKey,
            JSON.stringify({ evidenceCount: cand.evidenceItems.length })
          ]
        );
        oppId = insertRes.rows[0].id;
        savedOpportunities.push(insertRes.rows[0]);
      }

      // Persist evidence records
      for (const ev of cand.evidenceItems) {
        await db.query(
          `INSERT INTO opportunity_evidence 
           (organization_id, opportunity_id, evidence_type, reference_id, title, snippet, url, confidence)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT DO NOTHING`,
          [
            organizationId,
            oppId,
            ev.type,
            ev.referenceId || null,
            ev.title,
            ev.snippet || null,
            ev.url || null,
            ev.confidence ?? 1.0
          ]
        );
      }
    }

    await AuditLogger.log({
      organizationId,
      action: 'OPPORTUNITIES_GENERATED',
      entityType: 'OPPORTUNITY',
      details: { generatedCount: savedOpportunities.length }
    });

    return this.getOpportunities(organizationId);
  }

  public static async getOpportunities(
    organizationId: string,
    filters: {
      status?: OpportunityStatus;
      priority?: OpportunityPriority;
      opportunityType?: OpportunityType;
      competitorId?: string;
    } = {}
  ): Promise<Opportunity[]> {
    let sql = `SELECT * FROM opportunities WHERE organization_id = $1`;
    const params: any[] = [organizationId];

    if (filters.status) {
      params.push(filters.status);
      sql += ` AND status = $${params.length}`;
    }
    if (filters.priority) {
      params.push(filters.priority);
      sql += ` AND priority = $${params.length}`;
    }
    if (filters.opportunityType) {
      params.push(filters.opportunityType);
      sql += ` AND opportunity_type = $${params.length}`;
    }
    if (filters.competitorId) {
      params.push(filters.competitorId);
      sql += ` AND competitor_id = $${params.length}`;
    }

    sql += ` ORDER BY score DESC, created_at DESC`;
    const res = await db.query(sql, params);
    return res.rows;
  }

  public static async getOpportunityById(organizationId: string, id: string): Promise<Opportunity & { evidenceList: OpportunityEvidence[] }> {
    const res = await db.query(
      `SELECT * FROM opportunities WHERE id = $1 AND organization_id = $2`,
      [id, organizationId]
    );
    if (res.rows.length === 0) {
      throw createHttpError(404, 'Opportunity not found or access denied.');
    }
    const opp = res.rows[0];

    const evRes = await db.query(
      `SELECT * FROM opportunity_evidence WHERE opportunity_id = $1 AND organization_id = $2 ORDER BY created_at ASC`,
      [id, organizationId]
    );

    return {
      ...opp,
      evidenceList: evRes.rows
    };
  }

  public static async getOpportunityEvidence(organizationId: string, opportunityId: string): Promise<OpportunityEvidence[]> {
    await this.getOpportunityById(organizationId, opportunityId);
    const res = await db.query(
      `SELECT * FROM opportunity_evidence WHERE opportunity_id = $1 AND organization_id = $2 ORDER BY created_at ASC`,
      [opportunityId, organizationId]
    );
    return res.rows;
  }

  public static async updateOpportunityStatus(
    organizationId: string,
    id: string,
    status: OpportunityStatus
  ): Promise<Opportunity> {
    await this.getOpportunityById(organizationId, id);

    const res = await db.query(
      `UPDATE opportunities 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND organization_id = $3
       RETURNING *`,
      [status, id, organizationId]
    );

    await AuditLogger.log({
      organizationId,
      action: 'OPPORTUNITY_STATUS_UPDATED',
      entityType: 'OPPORTUNITY',
      entityId: id,
      details: { opportunityId: id, newStatus: status }
    });

    return res.rows[0];
  }

  public static async getSummary(organizationId: string): Promise<OpportunitySummary> {
    const opps = await this.getOpportunities(organizationId);

    const byPriority = { critical: 0, high: 0, medium: 0, low: 0 };
    const byType: Record<string, number> = {};
    const byStatus = { open: 0, in_review: 0, accepted: 0, resolved: 0, dismissed: 0 };

    for (const opp of opps) {
      const prioKey = (opp.priority || 'LOW').toLowerCase() as keyof typeof byPriority;
      if (byPriority[prioKey] !== undefined) byPriority[prioKey]++;

      const typeKey = opp.opportunity_type || 'GENERAL';
      byType[typeKey] = (byType[typeKey] || 0) + 1;

      const statKey = (opp.status || 'OPEN').toLowerCase().replace('-', '_') as keyof typeof byStatus;
      if (byStatus[statKey] !== undefined) byStatus[statKey]++;
    }

    return {
      totalOpportunities: opps.length,
      byPriority,
      byType,
      byStatus,
      topOpportunities: opps.slice(0, 5)
    };
  }
}
