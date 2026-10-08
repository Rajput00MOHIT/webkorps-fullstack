function createHttpError(status: number, message: string): Error {
  const err = new Error(message);
  (err as any).status = status;
  return err;
}

import { db } from '../../db/client.js';
import { ObservationParser } from './observationParser.js';
import { OpportunityEngine } from './opportunityEngine.js';
import { PromptGenerator } from './promptGenerator.js';
import { GEOMetricsService } from './geoMetricsService.js';
import { AIVisibilityProviderFactory, AIVisibilityProviderUnavailableError } from './aiVisibilityProvider.js';
import { AuditLogger } from '../audit/auditLogger.js';
import type { PromptCategory, OpportunityPriority } from './geoTypes.js';

export class GEOService {
  /**
   * Retrieves registered AI Engines
   */
  public static async getEngines() {
    const res = await db.query(
      `SELECT id, provider, name, model, version, type, active, metadata, created_at
       FROM ai_engines WHERE active = TRUE ORDER BY name ASC`
    );
    return res.rows;
  }

  /**
   * Create a tracked visibility prompt
   */
  public static async createPrompt(input: {
    organizationId: string;
    promptText: string;
    category?: PromptCategory;
    language?: string;
    region?: string;
    targetEntity?: string;
  }) {
    const category = input.category || 'GENERAL';
    const language = input.language || 'en';
    const region = input.region || 'IN';
    const targetEntity = input.targetEntity || 'Webkorps';

    const res = await db.query(
      `INSERT INTO visibility_prompts (
        organization_id, prompt_text, category, language, region, target_entity, active
      ) VALUES ($1, $2, $3, $4, $5, $6, TRUE)
      RETURNING *`,
      [input.organizationId, input.promptText, category, language, region, targetEntity]
    );

    await AuditLogger.log({
      organizationId: input.organizationId,
      action: 'GEO_PROMPT_CREATED',
      entityType: 'VISIBILITY_PROMPT',
      entityId: res.rows[0].id,
      details: { promptText: input.promptText, category }
    });

    return res.rows[0];
  }

  /**
   * List visibility prompts for tenant
   */
  public static async getPrompts(organizationId: string, category?: string) {
    let sql = `SELECT * FROM visibility_prompts WHERE organization_id = $1`;
    const params: any[] = [organizationId];
    if (category) {
      sql += ` AND category = $2`;
      params.push(category);
    }
    sql += ` ORDER BY created_at DESC`;
    const res = await db.query(sql, params);
    return res.rows;
  }

  /**
   * Generates candidate prompts from company profile & knowledge graph
   */
  public static async generateCandidatePrompts(organizationId: string) {
    const entRes = await db.query(
      `SELECT name FROM knowledge_entities 
       WHERE organization_id = $1 AND entity_type = 'SERVICE' LIMIT 5`,
      [organizationId]
    );
    const services = entRes.rows.map(r => r.name);
    return PromptGenerator.generateCandidates('Webkorps', services.length > 0 ? services : undefined);
  }

  /**
   * Executes an automated observation run via configured provider
   * If provider is unavailable, sets PROVIDER_UNAVAILABLE state (no fake data)
   */
  public static async queueObservationRun(input: {
    organizationId: string;
    promptId: string;
    engineId?: string;
    competitors?: string[];
  }) {
    // 1. Fetch prompt
    const pRes = await db.query(
      `SELECT * FROM visibility_prompts WHERE id = $1 AND organization_id = $2`,
      [input.promptId, input.organizationId]
    );
    if (pRes.rows.length === 0) {
      throw createHttpError(404, 'Visibility prompt not found or access denied.');
    }
    const prompt = pRes.rows[0];

    // 2. Fetch Engine
    let engine = null;
    if (input.engineId) {
      const eRes = await db.query(`SELECT * FROM ai_engines WHERE id = $1`, [input.engineId]);
      if (eRes.rows.length > 0) engine = eRes.rows[0];
    }
    if (!engine) {
      const defRes = await db.query(`SELECT * FROM ai_engines WHERE name ILIKE '%ChatGPT%' OR engine_key = 'OPENAI_SEARCH' LIMIT 1`);
      engine = defRes.rows[0] || (await db.query(`SELECT * FROM ai_engines LIMIT 1`)).rows[0];
    }

    // 3. Create run record
    const runRes = await db.query(
      `INSERT INTO ai_observation_runs (
        organization_id, prompt_id, ai_engine_id, status, provider, model, prompt_text, target_entity
      ) VALUES ($1, $2, $3, 'QUEUED', $4, $5, $6, $7)
      RETURNING *`,
      [
        input.organizationId,
        prompt.id,
        engine?.id || null,
        engine?.provider || 'openai',
        engine?.model || 'gpt-4o',
        prompt.prompt_text,
        prompt.target_entity
      ]
    );
    const runId = runRes.rows[0].id;

    // 4. Async Execution
    setImmediate(async () => {
      try {
        await db.query(`UPDATE ai_observation_runs SET status = 'RUNNING' WHERE id = $1`, [runId]);
        const provider = AIVisibilityProviderFactory.getProvider(engine?.provider || 'openai');
        const isAvail = await provider.isAvailable();

        if (!isAvail) {
          await db.query(
            `UPDATE ai_observation_runs 
             SET status = 'PROVIDER_UNAVAILABLE', error_message = $1, completed_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            ['AI Visibility provider is not configured with live credentials. Fabricated observations are prohibited.', runId]
          );
          return;
        }

        const resp = await provider.runPrompt({
          prompt: prompt.prompt_text,
          targetEntity: prompt.target_entity,
          competitors: input.competitors,
          language: prompt.language,
          region: prompt.region
        });

        // Parse and persist findings
        await this.persistObservationResults(
          runId,
          input.organizationId,
          prompt.prompt_text,
          prompt.target_entity,
          resp.rawResponse,
          input.competitors
        );

        await db.query(
          `UPDATE ai_observation_runs 
           SET status = 'COMPLETED', raw_response = $1, completed_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [resp.rawResponse, runId]
        );
      } catch (err: any) {
        await db.query(
          `UPDATE ai_observation_runs 
           SET status = 'FAILED', error_message = $1, completed_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [err.message, runId]
        );
      }
    });

    return runRes.rows[0];
  }

  /**
   * Manual Observation Import: Ingests real observations from ChatGPT/Perplexity/Gemini
   */
  public static async importObservation(input: {
    organizationId: string;
    engineName: string;
    model?: string;
    promptText: string;
    rawResponse: string;
    targetEntity?: string;
    competitors?: string[];
    observedAt?: string;
  }) {
    if (!input.promptText || !input.rawResponse) {
      throw createHttpError(400, 'promptText and rawResponse are required.');
    }

    const targetEntity = input.targetEntity || 'Webkorps';

    // 1. Find or create prompt
    let promptId: string | null = null;
    const pCheck = await db.query(
      `SELECT id FROM visibility_prompts WHERE organization_id = $1 AND prompt_text = $2`,
      [input.organizationId, input.promptText]
    );
    if (pCheck.rows.length > 0) {
      promptId = pCheck.rows[0].id;
    } else {
      const pNew = await db.query(
        `INSERT INTO visibility_prompts (organization_id, prompt_text, category, target_entity)
         VALUES ($1, $2, 'GENERAL', $3) RETURNING id`,
        [input.organizationId, input.promptText, targetEntity]
      );
      promptId = pNew.rows[0].id;
    }

    // 2. Find engine
    const eRes = await db.query(
      `SELECT id, provider FROM ai_engines WHERE name ILIKE $1 OR engine_key ILIKE $1 LIMIT 1`,
      [`%${input.engineName}%`]
    );
    let engineId = eRes.rows[0]?.id || null;
    let provider = eRes.rows[0]?.provider || input.engineName.toLowerCase();
    if (!engineId) {
      const anyEng = await db.query(`SELECT id, provider FROM ai_engines LIMIT 1`);
      if (anyEng.rows.length > 0) {
        engineId = anyEng.rows[0].id;
        provider = anyEng.rows[0].provider || provider;
      }
    }

    // 3. Create observation run record
    const runRes = await db.query(
      `INSERT INTO ai_observation_runs (
        organization_id, prompt_id, ai_engine_id, status, provider, model,
        prompt_text, target_entity, raw_response, completed_at
      ) VALUES ($1, $2, $3, 'COMPLETED', $4, $5, $6, $7, $8, COALESCE($9, CURRENT_TIMESTAMP))
      RETURNING *`,
      [
        input.organizationId,
        promptId,
        engineId,
        provider,
        input.model || 'unknown',
        input.promptText,
        targetEntity,
        input.rawResponse,
        input.observedAt ? new Date(input.observedAt) : null
      ]
    );
    const runId = runRes.rows[0].id;

    // 4. Parse & Persist Mentions, Citations, Competitors, and Opportunities
    const parsed = await this.persistObservationResults(
      runId,
      input.organizationId,
      input.promptText,
      targetEntity,
      input.rawResponse,
      input.competitors
    );

    await AuditLogger.log({
      organizationId: input.organizationId,
      action: 'GEO_OBSERVATION_IMPORTED',
      entityType: 'AI_OBSERVATION_RUN',
      entityId: runId,
      details: { engine: input.engineName, prompt: input.promptText }
    });

    return {
      run: runRes.rows[0],
      parsed
    };
  }

  /**
   * Internal helper to parse response and insert mentions, citations, competitors, opportunities
   */
  private static async persistObservationResults(
    runId: string,
    organizationId: string,
    promptText: string,
    targetEntity: string,
    rawResponse: string,
    configuredCompetitors?: string[]
  ) {
    const parsed = ObservationParser.parse(rawResponse, targetEntity, 'webkorps.com', configuredCompetitors);

    // 1. Insert Target Mention
    await db.query(
      `INSERT INTO ai_mentions (
        observation_run_id, organization_id, entity_name, entity_type, mentioned,
        position, mention_context, recommendation_signal, confidence
      ) VALUES ($1, $2, $3, 'COMPANY', $4, $5, $6, $7, $8)`,
      [
        runId,
        organizationId,
        parsed.targetMention.entityName,
        parsed.targetMention.mentioned,
        parsed.targetMention.position || null,
        parsed.targetMention.mentionContext || null,
        parsed.targetMention.recommendationSignal,
        parsed.targetMention.confidence
      ]
    );

    // 2. Insert Competitor Mentions
    for (const comp of parsed.competitors) {
      await db.query(
        `INSERT INTO ai_competitor_mentions (
          observation_run_id, organization_id, competitor_name, mentioned,
          position, recommendation_signal, context
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          runId,
          organizationId,
          comp.competitorName,
          comp.mentioned,
          comp.position || null,
          comp.recommendationSignal,
          comp.context || null
        ]
      );
    }

    // 3. Insert Citations
    for (const cite of parsed.citations) {
      await db.query(
        `INSERT INTO ai_citations (
          observation_run_id, organization_id, cited_url, cited_domain,
          cited_title, citation_context, citation_position, is_target_domain
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          runId,
          organizationId,
          cite.citedUrl,
          cite.citedDomain,
          cite.citedTitle || null,
          cite.citationContext || null,
          cite.citationPosition || null,
          cite.isTargetDomain
        ]
      );
    }

    // 4. Generate & Persist Opportunities
    const opps = OpportunityEngine.evaluateOpportunities(
      promptText,
      parsed.targetMention.mentioned,
      parsed.targetMention.recommendationSignal,
      parsed.citations.some(c => c.isTargetDomain),
      parsed.competitors.map(c => ({ competitorName: c.competitorName, recommended: c.recommendationSignal })),
      parsed.citations
    );

    for (const opp of opps) {
      await db.query(
        `INSERT INTO geo_opportunities (
          organization_id, opportunity_type, title, description, evidence,
          related_query, related_url, competitor, priority, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'OPEN')`,
        [
          organizationId,
          opp.opportunityType,
          opp.title,
          opp.description,
          opp.evidence || null,
          opp.relatedQuery || null,
          opp.relatedUrl || null,
          opp.competitor || null,
          opp.priority
        ]
      );
    }

    return parsed;
  }

  /**
   * Query observation runs
   */
  public static async getObservations(organizationId: string) {
    const res = await db.query(
      `SELECT r.*, e.name as engine_name, p.category as prompt_category
       FROM ai_observation_runs r
       LEFT JOIN ai_engines e ON r.ai_engine_id = e.id
       LEFT JOIN visibility_prompts p ON r.prompt_id = p.id
       WHERE r.organization_id = $1
       ORDER BY r.created_at DESC`,
      [organizationId]
    );
    return res.rows;
  }

  /**
   * Query structured mentions
   */
  public static async getMentions(organizationId: string) {
    const res = await db.query(
      `SELECT m.*, r.prompt_text, r.provider, r.model, r.created_at as observed_at
       FROM ai_mentions m
       JOIN ai_observation_runs r ON m.observation_run_id = r.id
       WHERE m.organization_id = $1
       ORDER BY m.created_at DESC`,
      [organizationId]
    );
    return res.rows;
  }

  /**
   * Query citations
   */
  public static async getCitations(organizationId: string) {
    const res = await db.query(
      `SELECT c.*, r.prompt_text, r.provider, r.created_at as observed_at
       FROM ai_citations c
       JOIN ai_observation_runs r ON c.observation_run_id = r.id
       WHERE c.organization_id = $1
       ORDER BY c.created_at DESC`,
      [organizationId]
    );
    return res.rows;
  }

  /**
   * Query competitor mentions
   */
  public static async getCompetitors(organizationId: string) {
    const res = await db.query(
      `SELECT cm.*, r.prompt_text, r.provider, r.created_at as observed_at
       FROM ai_competitor_mentions cm
       JOIN ai_observation_runs r ON cm.observation_run_id = r.id
       WHERE cm.organization_id = $1
       ORDER BY cm.created_at DESC`,
      [organizationId]
    );
    return res.rows;
  }

  /**
   * Query opportunities
   */
  public static async getOpportunities(organizationId: string) {
    const res = await db.query(
      `SELECT * FROM geo_opportunities
       WHERE organization_id = $1
       ORDER BY 
         CASE priority WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END,
         created_at DESC`,
      [organizationId]
    );
    return res.rows;
  }

  /**
   * Calculate summary metrics
   */
  public static async getSummary(organizationId: string) {
    return GEOMetricsService.calculateSummary(organizationId);
  }
}
