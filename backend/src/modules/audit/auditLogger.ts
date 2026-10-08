import { db } from '../../db/client.js';

export interface AuditLogEntry {
  organizationId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export class AuditLogger {
  public static async log(entry: AuditLogEntry): Promise<void> {
    try {
      await db.query(
        `INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          entry.organizationId,
          entry.userId || null,
          entry.action,
          entry.entityType,
          entry.entityId || null,
          JSON.stringify(entry.details || {}),
          entry.ipAddress || null
        ]
      );
    } catch (err) {
      console.error('[AuditLogger Error] Failed to persist audit log:', err);
    }
  }

  public static async getLogs(organizationId: string, limit = 50): Promise<any[]> {
    const res = await db.query(
      `SELECT * FROM audit_logs WHERE organization_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [organizationId, limit]
    );
    return res.rows;
  }
}
