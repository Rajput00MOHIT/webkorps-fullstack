import { PGlite } from '@electric-sql/pglite';
import { vector } from '@electric-sql/pglite-pgvector';
import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

class DatabaseManager {
  private pgliteInstance: PGlite | null = null;
  private pgPool: pg.Pool | null = null;
  private mode: 'pglite' | 'pool' = 'pglite';
  private initializingPromise: Promise<void> | null = null;

  public async getClient(): Promise<{ query: (sql: string, params?: any[]) => Promise<QueryResult>; exec: (sql: string) => Promise<void> }> {
    await this.ensureReady();

    if (this.mode === 'pool' && this.pgPool) {
      return {
        query: async (sql: string, params?: any[]) => {
          const res = await this.pgPool!.query(sql, params);
          return { rows: res.rows, rowCount: res.rowCount || res.rows.length };
        },
        exec: async (sql: string) => {
          await this.pgPool!.query(sql);
        }
      };
    }

    return {
      query: async (sql: string, params?: any[]) => {
        const res = await this.pgliteInstance!.query(sql, params);
        return { rows: res.rows as any[], rowCount: res.rows.length };
      },
      exec: async (sql: string) => {
        await this.pgliteInstance!.exec(sql);
      }
    };
  }

  public async ensureReady(): Promise<void> {
    if (this.pgliteInstance || this.pgPool) return;
    if (this.initializingPromise) return this.initializingPromise;

    this.initializingPromise = (async () => {
      const dbUrl = process.env.DATABASE_URL;
      let poolConnected = false;

      if (dbUrl && !dbUrl.includes('localhost:5432/corp_talk_db_disabled')) {
        try {
          const pool = new pg.Pool({ connectionString: dbUrl, connectionTimeoutMillis: 1500 });
          const res = await pool.query('SELECT 1 as connected');
          if (res.rows?.[0]?.connected === 1) {
            this.pgPool = pool;
            this.mode = 'pool';
            poolConnected = true;
            console.log('[Database] Connected to external PostgreSQL via Pool');
          }
        } catch {
          poolConnected = false;
        }
      }

      if (!poolConnected) {
        const dataDir = process.env.PGLITE_DATA_DIR || path.resolve(__dirname, "../../data/corp_talk_pg");
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        const pidFile = path.join(dataDir, 'postmaster.pid');
        if (fs.existsSync(pidFile)) {
          try { fs.unlinkSync(pidFile); } catch {}
        }

        try {
          this.pgliteInstance = new PGlite(dataDir, {
            extensions: { vector }
          });
          await this.pgliteInstance.waitReady;
        } catch (initErr) {
          await new Promise(r => setTimeout(r, 600));
          try {
            this.pgliteInstance = new PGlite(dataDir, {
              extensions: { vector }
            });
            await this.pgliteInstance.waitReady;
          } catch (retryLockErr) {
            console.warn("[Database] PGlite failed to recover existing directory. Initializing clean self-healing storage...");
            try {
              fs.rmSync(dataDir, { recursive: true, force: true });
              fs.mkdirSync(dataDir, { recursive: true });
              this.pgliteInstance = new PGlite(dataDir, {
                extensions: { vector }
              });
              await this.pgliteInstance.waitReady;
            } catch (retryErr) {
              console.error("[Database] Critical PGlite initialization failure:", retryErr);
              throw retryErr;
            }
          }
        }

        this.mode = 'pglite';
        console.log('[Database] Initialized real PostgreSQL engine (PGlite + pgvector) at:', dataDir);
      }

      // Execute versioned forward-only migrations
      await this.applyMigrations();
    })();

    await this.initializingPromise;
  }

  private async applyMigrations(): Promise<void> {
    let migrationsDir = path.resolve(__dirname, "migrations");
    if (!fs.existsSync(migrationsDir)) {
      migrationsDir = path.resolve(__dirname, "../../src/db/migrations");
    }
    if (!fs.existsSync(migrationsDir)) return;

    const createMigrationsTable = `
      CREATE TABLE IF NOT EXISTS _migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    if (this.mode === 'pool' && this.pgPool) {
      await this.pgPool.query(createMigrationsTable);
    } else if (this.pgliteInstance) {
      await this.pgliteInstance.exec(createMigrationsTable);
    }

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
      let alreadyApplied = false;
      const checkSql = `SELECT name FROM _migrations WHERE name = $1;`;

      if (this.mode === 'pool' && this.pgPool) {
        const res = await this.pgPool.query(checkSql, [file]);
        alreadyApplied = res.rows.length > 0;
      } else if (this.pgliteInstance) {
        const res = await this.pgliteInstance.query(checkSql, [file]);
        alreadyApplied = (res.rows as any[]).length > 0;
      }

      if (!alreadyApplied) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        if (this.mode === 'pool' && this.pgPool) {
          await this.pgPool.query(sql);
          await this.pgPool.query(`INSERT INTO _migrations (name) VALUES ($1);`, [file]);
        } else if (this.pgliteInstance) {
          await this.pgliteInstance.exec(sql);
          await this.pgliteInstance.query(`INSERT INTO _migrations (name) VALUES ($1);`, [file]);
        }
        console.log(`[Database] Applied migration: ${file}`);
      }
    }

    try {
      await this.query(
        `INSERT INTO organizations (id, name, slug) VALUES ('00000000-0000-0000-0000-000000000001', 'Webkorps', 'webkorps') ON CONFLICT (id) DO NOTHING`
      );
    } catch {
      // ignore
    }
  }

  public async query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
    const client = await this.getClient();
    return client.query(sql, params);
  }

  public async exec(sql: string): Promise<void> {
    const client = await this.getClient();
    return client.exec(sql);
  }

  public async isHealthy(): Promise<{ ok: boolean; mode: string; version: string; error?: string }> {
    try {
      await this.ensureReady();
      const res = await this.query('SELECT version() as version;');
      return {
        ok: true,
        mode: this.mode,
        version: res.rows[0]?.version || 'PostgreSQL 18.3 (PGlite)'
      };
    } catch (err: any) {
      return {
        ok: false,
        mode: this.mode,
        version: 'unknown',
        error: err.message
      };
    }
  }

  public async close(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
      this.pgPool = null;
    }
    if (this.pgliteInstance) {
      await this.pgliteInstance.close();
      this.pgliteInstance = null;
    }
    this.initializingPromise = null;
  }
}

export const db = new DatabaseManager();
