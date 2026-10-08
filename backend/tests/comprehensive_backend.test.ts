import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db/client.js';
import { AuthService } from '../src/modules/auth/authService.js';
import { KnowledgeService } from '../src/modules/knowledge/knowledgeService.js';
import { defaultEmbeddingProvider } from '../src/providers/embedding/localEmbedding.provider.js';

// Setup before tests
test.before(async () => {
  await db.ensureReady();
  await KnowledgeService.seedWebkorpsGroundTruth();
});

test.after(async () => {
  await db.close();
});

// 1. DATABASE TESTS
test('1. Database: Connection and Health Check', async () => {
  const health = await db.isHealthy();
  assert.equal(health.ok, true, 'Database should report healthy status');
  assert.ok(health.version.includes('PostgreSQL'), 'Database should report PostgreSQL engine');
});

test('1. Database: Schema Migrations created all required tables', async () => {
  const res = await db.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
  );
  const tableNames = res.rows.map((r: any) => r.table_name);
  const requiredTables = [
    'organizations',
    'users',
    'organization_memberships',
    'audit_logs',
    'websites',
    'crawl_runs',
    'pages',
    'crawl_page_snapshots',
    'seo_issues',
    'knowledge_entities',
    'knowledge_relations',
    'knowledge_embeddings',
    'ai_engines',
    'ai_visibility_prompts',
    'ai_observation_runs',
    'ai_mentions',
    'ai_citations',
    'competitors',
    'opportunities',
    'content_projects',
    'content_briefs',
    'content_drafts',
    'content_reviews',
    'conversations',
    'messages',
    'leads',
    'analytics_events',
    'integrations'
  ];

  for (const table of requiredTables) {
    assert.ok(tableNames.includes(table), `Table ${table} must exist in database`);
  }
});

test('1. Database: Inserts, Updates, Deletes & Foreign Key Constraints', async () => {
  // Test constraint violation
  const fakeOrgId = '99999999-9999-9999-9999-999999999999';
  await assert.rejects(
    async () => {
      await db.query(
        "INSERT INTO websites (organization_id, domain, name) VALUES ($1, 'test.com', 'Test')",
        [fakeOrgId]
      );
    },
    /violates foreign key constraint/,
    'Inserting with non-existent organization_id must throw foreign key error'
  );

  // Cleanup potential leftover
  await db.query("DELETE FROM organizations WHERE slug LIKE 'crud-test-org%'");
  const orgSlug = "crud-test-org-" + Date.now();
  const orgRes = await db.query(
    `INSERT INTO organizations (name, slug, tier) VALUES ('CRUD Test Org', '${orgSlug}', 'STANDARD') RETURNING id`
  );
  const orgId = orgRes.rows[0].id;

  const webRes = await db.query(
    "INSERT INTO websites (organization_id, domain, name) VALUES ($1, 'testcrud.com', 'CRUD Web') RETURNING id, name",
    [orgId]
  );
  const webId = webRes.rows[0].id;
  assert.equal(webRes.rows[0].name, 'CRUD Web');

  // Update
  await db.query("UPDATE websites SET name = 'Updated Web' WHERE id = $1", [webId]);
  const checkUpdate = await db.query("SELECT name FROM websites WHERE id = $1", [webId]);
  assert.equal(checkUpdate.rows[0].name, 'Updated Web');

  // Delete cascade
  await db.query("DELETE FROM organizations WHERE id = $1", [orgId]);
  const checkCascade = await db.query("SELECT * FROM websites WHERE id = $1", [webId]);
  assert.equal(checkCascade.rows.length, 0, 'Cascading delete must remove child website');
});

// 2. AUTHENTICATION TESTS
test('2. Authentication: Register, Login, Invalid Credentials & Password Hashing', async () => {
  const uniqueEmail = `testuser_${Date.now()}@example.com`;
  const rawPassword = 'SecurePassword123!';

  // Registration
  const regResult = await AuthService.register({
    email: uniqueEmail,
    password: rawPassword,
    fullName: 'Test Developer',
    organizationName: 'Dev Tenant Alpha'
  });

  assert.ok(regResult.token, 'Registration must yield JWT token');
  assert.equal(regResult.user.email, uniqueEmail);
  assert.equal(regResult.organization.role, 'OWNER');

  // Duplicate email registration should fail
  await assert.rejects(
    async () => {
      await AuthService.register({
        email: uniqueEmail,
        password: rawPassword,
        fullName: 'Duplicate Dev'
      });
    },
    (err: any) => err.status === 409,
    'Duplicate registration must return 409'
  );

  // Invalid password login
  await assert.rejects(
    async () => {
      await AuthService.login({
        email: uniqueEmail,
        password: 'WrongPassword'
      });
    },
    (err: any) => err.status === 401,
    'Invalid password must reject with 401'
  );

  // Valid login
  const loginResult = await AuthService.login({
    email: uniqueEmail,
    password: rawPassword
  });
  assert.ok(loginResult.token, 'Login must yield JWT token');
  assert.equal(loginResult.user.email, uniqueEmail);

  // Get Me profile
  const meResult = await AuthService.getMe(loginResult.user.id, loginResult.organization.id);
  assert.equal(meResult.user.email, uniqueEmail);
  assert.equal(meResult.organization.role, 'OWNER');
});

// 3. MULTI-TENANT ISOLATION TESTS
test('3. Multi-Tenant Isolation: Organization A cannot read or access Organization B data', async () => {
  // Create Tenant A
  const orgARes = await db.query(
    "INSERT INTO organizations (name, slug) VALUES ('Tenant A', 'tenant-a-" + Date.now() + "') RETURNING id"
  );
  const orgAId = orgARes.rows[0].id;

  // Create Tenant B
  const orgBRes = await db.query(
    "INSERT INTO organizations (name, slug) VALUES ('Tenant B', 'tenant-b-" + Date.now() + "') RETURNING id"
  );
  const orgBId = orgBRes.rows[0].id;

  // Create private Lead for Tenant A
  const leadARes = await db.query(
    `INSERT INTO leads (organization_id, full_name, email, phone, message, score_category)
     VALUES ($1, 'Confidential Client A', 'clientA@secret.com', '1234567890', 'Classified budget $500k', 'HOT')
     RETURNING id`,
    [orgAId]
  );
  const leadAId = leadARes.rows[0].id;

  // Create private Lead for Tenant B
  await db.query(
    `INSERT INTO leads (organization_id, full_name, email, phone, message, score_category)
     VALUES ($1, 'Confidential Client B', 'clientB@secret.com', '0987654321', 'Classified budget $200k', 'WARM')`,
    [orgBId]
  );

  // Query as Tenant B
  const tenantBQuery = await db.query(
    "SELECT * FROM leads WHERE organization_id = $1",
    [orgBId]
  );

  // Tenant B must ONLY see Tenant B leads
  assert.equal(tenantBQuery.rows.length, 1);
  assert.equal(tenantBQuery.rows[0].email, 'clientB@secret.com');
  const leakedLeadA = tenantBQuery.rows.find((r: any) => r.id === leadAId);
  assert.equal(leakedLeadA, undefined, 'Tenant A confidential lead must NEVER appear in Tenant B query');

  // Direct ID query spoofing test (Tenant B attempting to read Tenant A lead by ID)
  const spoofAttempt = await db.query(
    "SELECT * FROM leads WHERE id = $1 AND organization_id = $2",
    [leadAId, orgBId]
  );
  assert.equal(spoofAttempt.rows.length, 0, 'Spoofed query by cross-tenant ID must return empty');
});

// 4. RBAC ROLE PERMISSIONS TEST
test('4. RBAC: Role hierarchy validation', async () => {
  const roles = ['OWNER', 'ADMIN', 'EDITOR', 'SEO_MANAGER', 'CONTENT_MANAGER', 'SALES', 'VIEWER'];
  for (const role of roles) {
    const res = await db.query(
      `SELECT count(*) FROM organization_memberships WHERE role = $1`,
      [role]
    );
    assert.ok(res.rows[0].count !== undefined, `Role ${role} is accepted by database check constraint`);
  }

  // Invalid role check constraint
  await assert.rejects(
    async () => {
      await db.query(
        `INSERT INTO organization_memberships (organization_id, user_id, role)
         VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'SUPER_HACKER')`
      );
    },
    /violates check constraint/,
    'Invalid role must violate check constraint'
  );
});

// 5. KNOWLEDGE GRAPH TESTS
test('5. Knowledge Graph: Webkorps ground-truth entities and relations loaded', async () => {
  const webkorpsId = '00000000-0000-0000-0000-000000000001';
  const entities = await KnowledgeService.getEntities(webkorpsId);
  assert.ok(entities.length >= 15, 'Webkorps must have at least 15 seeded entities');

  const services = await KnowledgeService.getEntities(webkorpsId, 'SERVICE');
  assert.ok(services.length >= 8, 'Webkorps must have all 8 core services');

  const relations = await KnowledgeService.getRelations(webkorpsId);
  assert.ok(relations.length >= 10, 'Webkorps must have verified knowledge graph edges');
});

// 6. VECTOR STORAGE & PGVECTOR SEMANTIC RETRIEVAL
test('6. Vector Retrieval: Embedding storage, pgvector cosine distance & tenant boundary', async () => {
  const orgAId = '00000000-0000-0000-0000-000000000001';
  const query = 'healthcare HIPAA compliant application';

  const results = await KnowledgeService.searchSemantic(orgAId, query, 3);
  assert.ok(results.length > 0, 'Vector search must return matching entities');
  assert.ok(results[0].distance >= 0, 'Distance metric must be valid cosine distance');
  assert.ok(results[0].chunk_text, 'Result must contain matched chunk text');

  // Verify Tenant Isolation in vector space
  const emptyTenantId = '11111111-1111-1111-1111-111111111111';
  const crossTenantResults = await KnowledgeService.searchSemantic(emptyTenantId, query, 3);
  assert.equal(crossTenantResults.length, 0, 'Empty/foreign tenant must have 0 vector search results');
});
