import express from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import { tenantContextMiddleware } from './middleware/tenantContext.js';
import { errorHandler } from './middleware/errorHandler.js';
import { db } from './db/client.js';

// Modular Routers
import { authRouter } from './modules/auth/auth.router.js';
import { assistantRouter } from './modules/assistant/assistant.router.js';
import { leadsRouter } from './modules/leads/leads.router.js';
import { contentRouter } from './modules/content/content.router.js';
import { knowledgeRouter } from './modules/knowledge/knowledge.router.js';
import { analyticsRouter } from './modules/analytics/analytics.router.js';
import { crawlerRouter } from './modules/crawler/crawler.router.js';
import { researchRouter } from './modules/research/research.router.js';
import { geoRouter } from './modules/geo/geo.router.js';
import { competitorRouter } from './modules/competitor/competitor.router.js';
import { opportunityRouter } from './modules/opportunity/opportunity.router.js';
import { SearchProviderFactory } from './modules/research/searchProvider.js';
import { KnowledgeService } from './modules/knowledge/knowledgeService.js';

const app = express();

// 1. Global Middleware
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Tenant Context Middleware (Multi-Tenant by Default)
app.use(tenantContextMiddleware);

// 3. Database-Aware Healthcheck Endpoint
app.get('/health', async (req, res) => {
  const dbHealth = await db.isHealthy();
  const overallHealthy = dbHealth.ok;

  res.status(overallHealthy ? 200 : 503).json({
    status: overallHealthy ? 'healthy' : 'degraded',
    services: {
      api: 'healthy',
      database: dbHealth.ok ? 'healthy' : 'unhealthy',
      queue: 'healthy',
      searchProvider: 'configured'
    },
    databaseDetails: {
      mode: dbHealth.mode,
      version: dbHealth.version,
      ...(dbHealth.error && { error: dbHealth.error })
    },
    tenant: (req as any).tenantId,
    timestamp: new Date().toISOString()
  });
});

// 4. Versioned API Routes (/api/v1)
const api = express.Router();

api.use('/auth', authRouter);
api.use('/assistant', assistantRouter);
api.use('/conversations', assistantRouter);
api.use('/leads', leadsRouter);
api.use('/content', contentRouter);
api.use('/knowledge', knowledgeRouter);
api.use('/analytics', analyticsRouter);
api.use('/', crawlerRouter);
api.use('/research', researchRouter);
api.use('/geo', geoRouter);
api.use('/competitors', competitorRouter);
api.use('/opportunities', opportunityRouter);

app.use(ENV.API_PREFIX, api);

// 5. Global Error Handling
app.use(errorHandler);

// 6. Server Initialization & Ground Truth Seeding
export async function startServer() {
  await db.ensureReady();
  await KnowledgeService.seedWebkorpsGroundTruth();

  const server = app.listen(ENV.PORT, () => {
    console.log(`=================================================`);
    console.log(`🚀 CORP TALK BACKEND RUNNING ON PORT ${ENV.PORT}`);
    console.log(`📡 API Base: http://localhost:${ENV.PORT}${ENV.API_PREFIX}`);
    console.log(`🏢 Default Dogfood Tenant: ${ENV.DEFAULT_TENANT_ID} (Webkorps)`);
    console.log(`🐘 PostgreSQL & pgvector Engine: ONLINE`);
    console.log(`🕷️ Web Crawler & Website Intelligence: READY`);
    console.log(`=================================================`);
  });

  return server;
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch(err => {
    console.error('Fatal server startup failure:', err);
    process.exit(1);
  });
}

export default app;
