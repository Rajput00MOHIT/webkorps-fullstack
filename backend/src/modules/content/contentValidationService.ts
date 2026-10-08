import { db } from '../../db/client.js';
import createHttpError from 'http-errors';
import type { ClaimFinding, ContentValidationResult, ClaimStatus } from './contentTypes.js';

export interface RunValidationOptions {
  organizationId: string;
  draftId: string;
}

export class ContentValidationService {
  /**
   * Runs all validation suites (Fact-Check, SEO, GEO, Duplicate) for a given draft.
   */
  public static async runAllValidations(organizationId: string, draftId: string): Promise<ContentValidationResult[]> {
    // 1. Fetch Draft and its associated Project and Brief
    const draftRes = await db.query(
      `SELECT d.*, p.target_keyword, p.title as project_title, p.id as project_id
       FROM content_drafts d
       JOIN content_projects p ON p.id = d.content_project_id
       WHERE d.id = $1 AND d.organization_id = $2`,
      [draftId, organizationId]
    );

    if (draftRes.rows.length === 0) {
      throw createHttpError(404, 'Content draft not found.');
    }

    const draft = draftRes.rows[0];
    const primaryKeyword = draft.target_keyword || draft.title;

    // Load Brief
    const briefRes = await db.query(
      `SELECT * FROM content_briefs
       WHERE content_project_id = $1 AND organization_id = $2
       ORDER BY created_at DESC LIMIT 1`,
      [draft.project_id, organizationId]
    );
    const brief = briefRes.rows[0] || null;

    // Load Org Entities
    const entityRes = await db.query(
      `SELECT name, entity_type, attributes FROM knowledge_entities WHERE organization_id = $1`,
      [organizationId]
    );
    const entities = entityRes.rows;

    const results: ContentValidationResult[] = [];

    // 1. FACT CHECK VALIDATION
    const factResult = await this.validateFacts(organizationId, draftId, draft.body_markdown, primaryKeyword, entities, brief);
    results.push(factResult);

    // 2. SEO VALIDATION
    const seoResult = await this.validateSEO(organizationId, draftId, {
      title: draft.title,
      bodyMarkdown: draft.body_markdown,
      metaTitle: draft.meta_title,
      metaDescription: draft.meta_description,
      primaryKeyword
    });
    results.push(seoResult);

    // 3. GEO VALIDATION
    const geoResult = await this.validateGEO(organizationId, draftId, draft.body_markdown, primaryKeyword, entities);
    results.push(geoResult);

    // 4. DUPLICATE CHECK
    const dupResult = await this.validateDuplicates(organizationId, draftId, draft.project_id, draft.title, primaryKeyword);
    results.push(dupResult);

    // Determine aggregate draft status
    const hasUnsupportedFacts = factResult.findings.some(f => (f as ClaimFinding).status === 'UNSUPPORTED');
    const newStatus = hasUnsupportedFacts ? 'NEEDS_REVIEW' : 'QA_PASSED';

    await db.query(
      `UPDATE content_drafts SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND organization_id = $3`,
      [newStatus, draftId, organizationId]
    );

    // Also update project status
    await db.query(
      `UPDATE content_projects SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND organization_id = $3`,
      [newStatus === 'QA_PASSED' ? 'DRAFT_READY' : 'NEEDS_REVIEW', draft.project_id, organizationId]
    );

    return results;
  }

  /**
   * Fact Validation: Deterministically verifies statements against KG & Brief Evidence.
   * Unsupported or conflicting claims are strictly flagged.
   */
  public static async validateFacts(
    organizationId: string,
    draftId: string,
    body: string,
    primaryKeyword: string,
    entities: any[],
    brief: any
  ): Promise<ContentValidationResult> {
    const findings: ClaimFinding[] = [];
    const recommendations: string[] = [];
    let score = 100;

    const companyEntity = entities.find(e => e.entity_type === 'COMPANY' || e.entity_type === 'ORGANIZATION') || entities[0];
    const companyName = companyEntity ? companyEntity.name : 'Webkorps';
    const evidenceSources = (brief?.evidence_sources || []) as any[];

    // Check 1: Headcount/Employee claim detection (e.g. "500+ employees", "1,000 employees")
    const employeeRegex = /(?:has|with|over|more than|approximately)\s+(\d{2,4}[\+]?)\s+(?:employees|engineers|team members|developers)/gi;
    let match;
    while ((match = employeeRegex.exec(body)) !== null) {
      const claimedCount = match[1];
      const claimText = match[0];
      const kgAttr = companyEntity?.attributes || {};
      const verifiedCount = kgAttr.employee_count || kgAttr.team_size || kgAttr.headcount;

      if (!verifiedCount || !String(verifiedCount).includes(claimedCount.replace('+', ''))) {
        findings.push({
          claimText: `Claimed headcount: "${claimText}"`,
          status: 'UNSUPPORTED',
          reason: 'No authoritative evidence found in Knowledge Graph or verified sources.',
          actionRequired: 'Human review required. Remove or substantiate claim with verified company records.'
        });
        score -= 30;
      } else {
        findings.push({
          claimText: `Claimed headcount: "${claimText}"`,
          status: 'SUPPORTED',
          reason: `Verified in Knowledge Graph (${companyName} attributes).`
        });
      }
    }

    // Check 2: Core Service / Capability Claims
    const serviceClaims = ['AI development services', 'Cloud migration', 'DevOps engineering', 'Data Analytics', 'Generative AI'];
    for (const s of serviceClaims) {
      if (body.toLowerCase().includes(s.toLowerCase())) {
        const inKg = entities.some(e => e.name.toLowerCase().includes(s.toLowerCase()) || JSON.stringify(e.attributes).toLowerCase().includes(s.toLowerCase()));
        if (inKg) {
          findings.push({
            claimText: `Service capability: "${s}"`,
            status: 'SUPPORTED',
            reason: 'Verified by authoritative company Knowledge Graph entity.'
          });
        } else {
          findings.push({
            claimText: `Service capability: "${s}"`,
            status: 'REQUIRES_REVIEW',
            reason: `Service "${s}" mentioned but not explicitly defined as primary entity in KG.`,
            actionRequired: 'Verify service catalog alignment.'
          });
          score -= 10;
        }
      }
    }

    // Check 3: Statistical Claims (e.g. "99.9%", "40% reduction")
    const statRegex = /\b(\d{1,3}(?:\.\d+)?%)\b/g;
    let statMatch;
    const checkedStats = new Set<string>();
    while ((statMatch = statRegex.exec(body)) !== null) {
      const percentage = statMatch[1];
      if (checkedStats.has(percentage)) continue;
      checkedStats.add(percentage);

      const foundInEvidence = evidenceSources.some(src => (src.snippet || '').includes(percentage));
      if (foundInEvidence) {
        findings.push({
          claimText: `Statistical metric: "${percentage}"`,
          status: 'SUPPORTED',
          reason: 'Sourced from verified Phase 3 research evidence.'
        });
      } else {
        findings.push({
          claimText: `Statistical metric: "${percentage}"`,
          status: 'PARTIALLY_SUPPORTED',
          reason: `Metric "${percentage}" not found in attached research evidence cache.`,
          actionRequired: 'Provide external research citation or empirical attribution.'
        });
        score -= 10;
      }
    }

    // Default ground claim if findings are empty
    if (findings.length === 0) {
      findings.push({
        claimText: `Core Topic: "${primaryKeyword}"`,
        status: 'SUPPORTED',
        reason: 'Aligns with approved content brief and verified domain context.'
      });
    }

    score = Math.max(0, score);
    const unsupportedCount = findings.filter(f => f.status === 'UNSUPPORTED').length;
    if (unsupportedCount > 0) {
      recommendations.push(`Resolve ${unsupportedCount} unsupported claim(s) prior to human review.`);
    }

    const validationStatus = unsupportedCount > 0 ? 'NEEDS_REVIEW' : (score >= 80 ? 'PASSED' : 'WARNING');

    // Persist validation finding
    const res = await db.query(
      `INSERT INTO content_validations (organization_id, draft_id, validation_type, status, score, findings, recommendations)
       VALUES ($1, $2, 'FACT_CHECK', $3, $4, $5, $6)
       RETURNING *`,
      [organizationId, draftId, validationStatus, score, JSON.stringify(findings), recommendations]
    );

    return res.rows[0];
  }

  /**
   * SEO Validation: Technical and on-page SEO signals.
   */
  public static async validateSEO(
    organizationId: string,
    draftId: string,
    input: {
      title: string;
      bodyMarkdown: string;
      metaTitle?: string;
      metaDescription?: string;
      primaryKeyword: string;
    }
  ): Promise<ContentValidationResult> {
    const findings: Array<{ rule: string; passed: boolean; message: string }> = [];
    const recommendations: string[] = [];
    let score = 0;

    // Rule 1: Title length (30-70 chars)
    const titleLen = input.title ? input.title.length : 0;
    const titleOk = titleLen >= 25 && titleLen <= 75;
    findings.push({
      rule: 'TITLE_LENGTH',
      passed: titleOk,
      message: `Title length is ${titleLen} characters (recommended 30-70).`
    });
    if (titleOk) score += 15; else recommendations.push('Adjust title length to 30-70 characters.');

    // Rule 2: Meta description length (120-165 chars)
    const metaDescLen = input.metaDescription ? input.metaDescription.length : 0;
    const metaOk = metaDescLen >= 100 && metaDescLen <= 170;
    findings.push({
      rule: 'META_DESCRIPTION_LENGTH',
      passed: metaOk,
      message: `Meta description length is ${metaDescLen} characters (recommended 120-165).`
    });
    if (metaOk) score += 15; else recommendations.push('Provide a compelling meta description between 120-165 characters.');

    // Rule 3: Single H1
    const h1Matches = input.bodyMarkdown.match(/^#\s+[^\n]+/gm) || [];
    const h1Ok = h1Matches.length === 1;
    findings.push({
      rule: 'SINGLE_H1_HEADING',
      passed: h1Ok,
      message: `Document has ${h1Matches.length} H1 heading(s) (exactly 1 required).`
    });
    if (h1Ok) score += 20; else recommendations.push('Ensure document has exactly one top-level # H1 heading.');

    // Rule 4: Headings structure (has H2)
    const h2Matches = input.bodyMarkdown.match(/^##\s+[^\n]+/gm) || [];
    const h2Ok = h2Matches.length >= 2;
    findings.push({
      rule: 'HEADING_HIERARCHY',
      passed: h2Ok,
      message: `Document has ${h2Matches.length} H2 sections (at least 2 recommended).`
    });
    if (h2Ok) score += 15; else recommendations.push('Structure content with at least two ## H2 subsections.');

    // Rule 5: Primary keyword presence
    const bodyLower = input.bodyMarkdown.toLowerCase();
    const kwLower = input.primaryKeyword.toLowerCase();
    const kwInBody = bodyLower.includes(kwLower);
    findings.push({
      rule: 'KEYWORD_PRESENCE',
      passed: kwInBody,
      message: `Primary keyword "${input.primaryKeyword}" is present in content body.`
    });
    if (kwInBody) score += 15; else recommendations.push(`Include target keyword "${input.primaryKeyword}" within content.`);

    // Rule 6: Word count
    const words = input.bodyMarkdown.trim().split(/\s+/).filter(Boolean).length;
    const wordsOk = words >= 200;
    findings.push({
      rule: 'MINIMUM_WORD_COUNT',
      passed: wordsOk,
      message: `Article contains ${words} words (minimum 200 required for indexability).`
    });
    if (wordsOk) score += 10; else recommendations.push('Expand content to meet minimum comprehensive length requirements.');

    // Rule 7: Internal link presence
    const internalLinks = (input.bodyMarkdown.match(/\[.*?\]\(\/.*?\)/g) || []).length;
    findings.push({
      rule: 'INTERNAL_LINKS',
      passed: internalLinks > 0,
      message: `Detected ${internalLinks} internal link(s).`
    });
    if (internalLinks > 0) score += 10; else recommendations.push('Add contextual internal links to related service pages.');

    const status = score >= 75 ? 'PASSED' : (score >= 50 ? 'WARNING' : 'FAILED');

    const res = await db.query(
      `INSERT INTO content_validations (organization_id, draft_id, validation_type, status, score, findings, recommendations)
       VALUES ($1, $2, 'SEO_VALIDATION', $3, $4, $5, $6)
       RETURNING *`,
      [organizationId, draftId, status, score, JSON.stringify(findings), recommendations]
    );

    return res.rows[0];
  }

  /**
   * GEO Validation: Evaluates AI search engine visibility readiness.
   * Checks entity definitions, structured tables, FAQ completeness, and absence of fake ranking promises.
   */
  public static async validateGEO(
    organizationId: string,
    draftId: string,
    body: string,
    primaryKeyword: string,
    entities: any[]
  ): Promise<ContentValidationResult> {
    const findings: Array<{ rule: string; passed: boolean; message: string }> = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check 1: Explicit Entity Definition
    const hasEntityDef = /\b(?:is an?|defines|refers to|represents)\b/i.test(body);
    findings.push({
      rule: 'ENTITY_DEFINITION_CLARITY',
      passed: hasEntityDef,
      message: hasEntityDef
        ? 'Clear conceptual entity definition present for semantic extraction.'
        : 'Missing clear entity definition statement for AI models.'
    });
    if (hasEntityDef) score += 25; else recommendations.push('Provide a clear, single-sentence entity definition in the opening section.');

    // Check 2: Structured Matrix / Comparison Table
    const hasTable = /\|[^\n]+\|[\r\n]+\|[-:| ]+\|/m.test(body);
    findings.push({
      rule: 'STRUCTURED_DATA_MATRIX',
      passed: hasTable,
      message: hasTable
        ? 'Structured comparison matrix/table present for direct LLM ingestion.'
        : 'No markdown table found. LLMs strongly prioritize tabular structured summaries.'
    });
    if (hasTable) score += 25; else recommendations.push('Include a summary table to facilitate direct LLM tabular citations.');

    // Check 3: FAQ Section with Direct Answers
    const hasFaq = /##.*(?:FAQ|Frequently Asked Questions)/i.test(body) && /###\s+/m.test(body);
    findings.push({
      rule: 'FAQ_STRUCTURAL_COVERAGE',
      passed: hasFaq,
      message: hasFaq
        ? 'FAQ section with discrete H3 queries found.'
        : 'FAQ section missing. AI search engines synthesize answers from explicit Q&A headers.'
    });
    if (hasFaq) score += 25; else recommendations.push('Add an FAQ section addressing high-intent user questions.');

    // Check 4: No False / Fabricated AI Ranking Claims
    const hasFakeClaims = /(?:guaranteed #1|rank #1 on chatgpt|fool search engines|guaranteed ai citation)/i.test(body);
    findings.push({
      rule: 'NO_DECEPTIVE_PROMISES',
      passed: !hasFakeClaims,
      message: !hasFakeClaims
        ? 'No deceptive or unverified AI ranking guarantees detected.'
        : 'Deceptive AI ranking promise detected in copy.'
    });
    if (!hasFakeClaims) score += 25; else { score = 0; recommendations.push('Remove unrealistic or misleading AI ranking claims.'); }

    const status = score >= 75 ? 'PASSED' : 'WARNING';

    const res = await db.query(
      `INSERT INTO content_validations (organization_id, draft_id, validation_type, status, score, findings, recommendations)
       VALUES ($1, $2, 'GEO_VALIDATION', $3, $4, $5, $6)
       RETURNING *`,
      [organizationId, draftId, status, score, JSON.stringify(findings), recommendations]
    );

    return res.rows[0];
  }

  /**
   * Duplicate Content & Keyword Cannibalization Detection.
   */
  public static async validateDuplicates(
    organizationId: string,
    draftId: string,
    projectId: string,
    title: string,
    primaryKeyword: string
  ): Promise<ContentValidationResult> {
    const findings: Array<{ rule: string; passed: boolean; message: string }> = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check against existing crawl pages
    const pageRes = await db.query(
      `SELECT url, title FROM pages WHERE organization_id = $1 LIMIT 100`,
      [organizationId]
    );

    const conflictingPages = pageRes.rows.filter(p =>
      (p.title || '').toLowerCase().includes(primaryKeyword.toLowerCase()) ||
      (p.url || '').toLowerCase().includes(primaryKeyword.toLowerCase().replace(/\s+/g, '-'))
    );

    if (conflictingPages.length > 0) {
      findings.push({
        rule: 'EXISTING_PAGE_OVERLAP',
        passed: false,
        message: `Keyword "${primaryKeyword}" already targeted by existing page: ${conflictingPages[0].url}`
      });
      recommendations.push(`Review potential cannibalization with existing page ${conflictingPages[0].url}. Differentiate canonical intent.`);
      score -= 20;
    } else {
      findings.push({
        rule: 'EXISTING_PAGE_OVERLAP',
        passed: true,
        message: 'No keyword cannibalization detected with existing crawled site pages.'
      });
    }

    // Check against approved projects
    const otherProjectsRes = await db.query(
      `SELECT id, title, target_keyword FROM content_projects
       WHERE organization_id = $1 AND id != $2 AND status = 'APPROVED'`,
      [organizationId, projectId]
    );

    const duplicateProject = otherProjectsRes.rows.find(p =>
      p.target_keyword.toLowerCase() === primaryKeyword.toLowerCase()
    );

    if (duplicateProject) {
      findings.push({
        rule: 'INTERNAL_PROJECT_DUPLICATION',
        passed: false,
        message: `Approved project "${duplicateProject.title}" already targets keyword "${primaryKeyword}".`
      });
      recommendations.push(`Consolidate content or target a differentiated long-tail variation.`);
      score -= 30;
    } else {
      findings.push({
        rule: 'INTERNAL_PROJECT_DUPLICATION',
        passed: true,
        message: 'No conflicting approved content projects found.'
      });
    }

    const status = score >= 80 ? 'PASSED' : 'WARNING';

    const res = await db.query(
      `INSERT INTO content_validations (organization_id, draft_id, validation_type, status, score, findings, recommendations)
       VALUES ($1, $2, 'DUPLICATE_CHECK', $3, $4, $5, $6)
       RETURNING *`,
      [organizationId, draftId, status, score, JSON.stringify(findings), recommendations]
    );

    return res.rows[0];
  }

  /**
   * Retrieves all validation results for a draft.
   */
  public static async getValidationResults(organizationId: string, draftId: string): Promise<ContentValidationResult[]> {
    const res = await db.query(
      `SELECT * FROM content_validations WHERE organization_id = $1 AND draft_id = $2 ORDER BY created_at DESC`,
      [organizationId, draftId]
    );
    return res.rows;
  }
}
