import { Router } from 'express';
import type { Response } from 'express';
import type { TenantRequest } from '../../middleware/tenantContext.js';
import { KnowledgeService } from './knowledgeService.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

export const knowledgeRouter = Router();

/**
 * GET /api/v1/knowledge/ground-truth
 * Exposes authoritative entity graph for the active tenant
 */
knowledgeRouter.get('/ground-truth', async (req: TenantRequest, res: Response, next) => {
  try {
    const entities = await KnowledgeService.getEntities(req.tenantId!);
    const relations = await KnowledgeService.getRelations(req.tenantId!);
    res.json({
      organizationId: req.tenantId,
      entities,
      relations,
      totalEntities: entities.length,
      totalRelations: relations.length
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/knowledge/entities
 */
knowledgeRouter.get('/entities', async (req: TenantRequest, res: Response, next) => {
  try {
    const { type } = req.query;
    const entities = await KnowledgeService.getEntities(req.tenantId!, type as string | undefined);
    res.json({ entities, total: entities.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/knowledge/search
 * Semantic vector retrieval powered by pgvector
 */
knowledgeRouter.get('/search', async (req: TenantRequest, res: Response, next) => {
  try {
    const { q = '', limit = '5' } = req.query;
    if (!q) {
      res.status(400).json({ error: { message: 'Query parameter q is required.' } });
      return;
    }
    const results = await KnowledgeService.searchSemantic(req.tenantId!, String(q), parseInt(String(limit), 10));
    res.json({ query: q, results, total: results.length });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/knowledge/ingest
 * Ingests page content into structured entities, semantic chunks, and pgvector embeddings
 */
knowledgeRouter.post('/ingest', requireAuth, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: TenantRequest, res: Response, next) => {
  try {
    const { url, title, headings = { h1: [], h2: [], h3: [] }, cleanText, pageId } = req.body;
    if (!url || !cleanText) {
      res.status(400).json({ error: { message: 'url and cleanText are required.' } });
      return;
    }
    const { KnowledgeIngestionEngine } = await import('./knowledgeIngestionEngine.js');
    const result = await KnowledgeIngestionEngine.ingestPage({
      organizationId: req.tenantId!,
      pageId,
      url,
      title: title || '',
      headings,
      cleanText
    });
    res.status(201).json({ success: true, result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/knowledge/conflicts
 * Returns detected contradictory claims across sources
 */
knowledgeRouter.get('/conflicts', async (req: TenantRequest, res: Response, next) => {
  try {
    const { db } = await import('../../db/client.js');
    const conflicts = await db.query(
      `SELECT * FROM knowledge_conflicts WHERE organization_id = $1 ORDER BY created_at DESC`,
      [req.tenantId!]
    );
    res.json({ conflicts: conflicts.rows, total: conflicts.rows.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/knowledge/chunks
 * Returns semantic chunks for a given page or query
 */
knowledgeRouter.get('/chunks', async (req: TenantRequest, res: Response, next) => {
  try {
    const { pageId, limit = '20' } = req.query;
    const { db } = await import('../../db/client.js');
    let query = `SELECT * FROM knowledge_chunks WHERE organization_id = $1`;
    const params: any[] = [req.tenantId!];
    if (pageId) {
      params.push(pageId);
      query += ` AND page_id = $2`;
    }
    query += ` ORDER BY position ASC LIMIT ${Math.min(parseInt(String(limit), 10) || 20, 100)}`;
    const chunks = await db.query(query, params);
    res.json({ chunks: chunks.rows, total: chunks.rows.length });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/knowledge/feedback
 * Stores user / evaluator feedback for continuous learning
 */
knowledgeRouter.post('/feedback', async (req: TenantRequest, res: Response, next) => {
  try {
    const { conversationId, messageId, feedbackType, userComment, correctedIntent, correctedEntities } = req.body;
    if (!feedbackType) {
      res.status(400).json({ error: { message: 'feedbackType is required.' } });
      return;
    }
    const { db } = await import('../../db/client.js');
    const insertRes = await db.query(
      `INSERT INTO knowledge_feedback (
         organization_id, conversation_id, message_id, feedback_type, user_comment, corrected_intent, corrected_entities
       ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        req.tenantId!,
        conversationId || null,
        messageId || null,
        feedbackType,
        userComment || null,
        correctedIntent || null,
        JSON.stringify(correctedEntities || [])
      ]
    );
    res.status(201).json({ success: true, feedback: insertRes.rows[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/knowledge/entities (Protected - Admin/Editor)
 */
knowledgeRouter.post('/entities', requireAuth, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: TenantRequest, res: Response, next) => {
  try {
    const { entityType, name, attributes, sourceUrl } = req.body;
    if (!entityType || !name) {
      res.status(400).json({ error: { message: 'entityType and name are required.' } });
      return;
    }
    const entity = await KnowledgeService.createEntity({
      organizationId: req.tenantId!,
      entityType,
      name,
      attributes,
      sourceUrl
    });
    res.status(201).json(entity);
  } catch (err) {
    next(err);
  }
});
