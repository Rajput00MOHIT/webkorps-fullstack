import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import type { TenantRequest } from '../../middleware/tenantContext.js';
import { requireAuth } from '../../middleware/auth.js';
import { AssistantService } from './assistantService.js';

export const assistantRouter = Router();

import jwt from "jsonwebtoken";
import { ENV } from "../../config/env.js";

function getTenantId(req: TenantRequest): string {
  if (req.header("X-Tenant-ID")) {
    return req.header("X-Tenant-ID")!.trim();
  }
  const authHeader = req.header("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(authHeader.substring(7).trim(), ENV.JWT_SECRET) as any;
      if (decoded.organizationId) return decoded.organizationId;
    } catch {
      // fallback
    }
  }
  return req.tenantId || (req as any).organizationId || ENV.DEFAULT_TENANT_ID;
}

/**
 * POST /api/v1/assistant/conversations
 * Initialize or retrieve a tenant conversation
 */
assistantRouter.post('/conversations', async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const { sessionId, websiteId, visitorMetadata } = req.body;
    const sess = sessionId || `sess-${Date.now()}`;
    const conv = await AssistantService.getOrCreateConversation(orgId, sess, websiteId, visitorMetadata);
    res.status(201).json(conv);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/assistant/conversations
 * List conversations for authenticated tenant
 */
assistantRouter.get('/conversations', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const limit = parseInt(req.query.limit as string || '50', 10);
    const offset = parseInt(req.query.offset as string || '0', 10);
    const convs = await AssistantService.listConversations(orgId, limit, offset);
    res.json({ conversations: convs, total: convs.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/assistant/conversations/:id
 */
assistantRouter.get('/conversations/:id', async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const conv = await AssistantService.getConversation(orgId, req.params.id as string);
    res.json(conv);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/assistant/conversations/:id/messages
 */
assistantRouter.get('/conversations/:id/messages', async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const messages = await AssistantService.getMessages(orgId, req.params.id as string);
    res.json({ messages, total: messages.length });
  } catch (err) {
    next(err);
  }
});

/**
 * Helper to build standard full response containing both standard and UI-compatible message structure
 */
function buildFullChatResponse(result: any) {
  return {
    conversationId: result.conversationId,
    messageId: result.messageId,
    answer: result.answer,
    sources: result.sources,
    intent: result.intent,
    confidence: result.confidence,
    suggestedFollowups: result.suggestedFollowups,
    suggestedActions: result.suggestedActions,
    leadIntentSignal: result.leadIntentSignal,
    metadata: result.metadata,
    message: {
      id: result.messageId,
      sender: 'ai',
      text: result.answer,
      timestamp: Date.now(),
      actions: result.suggestedActions,
      route: result.intent,
      citations: result.sources?.map((s: any) => ({
        title: s.title,
        url: s.url || '#',
        domain: s.source_type,
        trust_level: s.trust_level
      }))
    }
  };
}

/**
 * Handler for sending messages in a conversation (supports both /messages and /conversations/messages)
 */
const handlePostChatMessage = async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const { message, text, query, conversationId, sessionId, websiteId, providerName, allowLocalFallback } = req.body;
    const queryText = text || message || query;
    const targetConvId = req.params?.id || conversationId;

    const result = await AssistantService.processQuery(
      orgId,
      queryText,
      targetConvId,
      sessionId,
      { providerName, allowLocalFallback, websiteId }
    );

    res.status(200).json(buildFullChatResponse(result));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/conversations/messages & POST /api/v1/assistant/messages
 */
assistantRouter.post('/messages', handlePostChatMessage);
assistantRouter.post('/conversations/messages', handlePostChatMessage);

/**
 * POST /api/v1/assistant/conversations/:id/messages
 * Post a user message and receive an evidence-grounded response
 */
assistantRouter.post('/conversations/:id/messages', handlePostChatMessage);

/**
 * POST /api/v1/assistant/query
 * Main query endpoint supporting stateless and stateful interactions
 */
assistantRouter.post('/query', async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const { query, message, text, conversationId, sessionId, websiteId, providerName, allowLocalFallback } = req.body;
    const queryText = query || message || text;

    const result = await AssistantService.processQuery(
      orgId,
      queryText,
      conversationId,
      sessionId,
      { websiteId, providerName, allowLocalFallback }
    );

    // Format response ensuring backward compatibility with UI ChatWindow contracts
    res.json({
      conversationId: result.conversationId,
      messageId: result.messageId,
      answer: result.answer,
      sources: result.sources,
      intent: result.intent,
      confidence: result.confidence,
      suggestedFollowups: result.suggestedFollowups,
      suggestedActions: result.suggestedActions,
      leadIntentSignal: result.leadIntentSignal,
      metadata: result.metadata,
      // UI-compatible message structure
      message: {
        id: result.messageId,
        sender: 'ai',
        text: result.answer,
        timestamp: Date.now(),
        actions: result.suggestedActions,
        route: result.intent,
        citations: result.sources.map(s => ({
          title: s.title,
          url: s.url || '#',
          domain: s.source_type,
          trust_level: s.trust_level
        }))
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/assistant/conversations/:id/ask
 * Interactive turn endpoint alias for asking a question within a conversation
 */
assistantRouter.post('/conversations/:id/ask', async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const { query, message, text, providerName, allowLocalFallback, websiteId } = req.body;
    const queryText = query || message || text;

    const result = await AssistantService.processQuery(
      orgId,
      queryText,
      req.params.id as string,
      undefined,
      { providerName, allowLocalFallback, websiteId }
    );
    res.json({
      status: 'success',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/assistant/evaluation
 * Retrieve assistant evaluation history and benchmark metrics
 */
assistantRouter.get('/evaluation', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const { AssistantEvaluationService } = await import('./assistantEvaluationService.js');
    const runs = await AssistantEvaluationService.getEvaluationRuns(orgId);
    res.json({ status: 'success', data: runs });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/assistant/evaluation/run
 * Trigger full benchmark evaluation run across 70 test cases
 */
assistantRouter.post('/evaluation/run', requireAuth, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const { AssistantEvaluationService } = await import('./assistantEvaluationService.js');
    const summary = await AssistantEvaluationService.runEvaluation(orgId);
    res.json({ status: 'success', data: summary });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/assistant/traces
 * Developer observability: retrieve recent request execution traces
 */
assistantRouter.get('/traces', async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const { AssistantTraceLogger } = await import('./observability/traceLogger.js');
    const limit = parseInt(req.query.limit as string || '20', 10);
    const traces = AssistantTraceLogger.getRecentTraces(limit);
    res.json({ status: 'success', data: traces, total: traces.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/assistant/traces/:id
 * Retrieve specific trace details by traceId
 */
assistantRouter.get('/traces/:id', async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const { AssistantTraceLogger } = await import('./observability/traceLogger.js');
    const trace = AssistantTraceLogger.getTraceById(req.params.id as string);
    if (!trace) {
      res.status(404).json({ status: 'error', message: 'Trace not found' });
      return;
    }
    res.json({ status: 'success', data: trace });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/assistant/workflow/execute
 * N8N & Agentic Workflow execution endpoint for dynamic research & query refinement
 */
assistantRouter.post('/workflow/execute', async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getTenantId(req);
    const { N8NWorkflowService } = await import('./n8n/n8nWorkflowService.js');
    const result = await N8NWorkflowService.executeWorkflow({
      organizationId: orgId,
      query: req.body.query,
      conversationId: req.body.conversationId,
      sessionId: req.body.sessionId,
      history: req.body.history,
      options: req.body.options
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});


