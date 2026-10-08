import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../db/client.js';
import { ENV } from '../../config/env.js';
import { AuditLogger } from '../audit/auditLogger.js';

export class AuthService {
  public static async register(data: {
    email: string;
    password: string;
    fullName: string;
    organizationName?: string;
  }) {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [data.email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      throw { status: 409, message: 'User with this email already exists.' };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);
    const normalizedEmail = data.email.toLowerCase().trim();

    // Create user
    const userRes = await db.query(
      `INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, created_at`,
      [normalizedEmail, passwordHash, data.fullName]
    );
    const user = userRes.rows[0];

    // Create organization (or assign to existing)
    const orgName = data.organizationName || `${data.fullName}'s Organization`;
    const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4);
    
    const orgRes = await db.query(
      `INSERT INTO organizations (name, slug, tier) VALUES ($1, $2, 'STANDARD') RETURNING id, name, slug`,
      [orgName, orgSlug]
    );
    const organization = orgRes.rows[0];

    // Assign OWNER membership
    await db.query(
      `INSERT INTO organization_memberships (organization_id, user_id, role) VALUES ($1, $2, 'OWNER')`,
      [organization.id, user.id]
    );

    // Audit log
    await AuditLogger.log({
      organizationId: organization.id,
      userId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      details: { email: user.email, orgName: organization.name }
    });

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        organizationId: organization.id,
        role: 'OWNER'
      },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN as any }
    );

    return {
      token,
      user: { id: user.id, email: user.email, fullName: user.full_name },
      organization: { id: organization.id, name: organization.name, role: 'OWNER' }
    };
  }

  public static async login(data: { email: string; password: string }) {
    const userRes = await db.query(
      `SELECT id, email, password_hash, full_name, is_active FROM users WHERE email = $1`,
      [data.email.toLowerCase().trim()]
    );

    if (userRes.rows.length === 0) {
      throw { status: 401, message: 'Invalid email or password.' };
    }

    const user = userRes.rows[0];
    if (!user.is_active) {
      throw { status: 403, message: 'User account is deactivated.' };
    }

    const isValid = await bcrypt.compare(data.password, user.password_hash);
    if (!isValid) {
      throw { status: 401, message: 'Invalid email or password.' };
    }

    // Fetch primary membership
    const memRes = await db.query(
      `SELECT m.role, o.id as org_id, o.name as org_name
       FROM organization_memberships m
       JOIN organizations o ON m.organization_id = o.id
       WHERE m.user_id = $1
       LIMIT 1`,
      [user.id]
    );

    const membership = memRes.rows[0] || {
      role: 'VIEWER',
      org_id: ENV.DEFAULT_TENANT_ID,
      org_name: 'Webkorps'
    };

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        organizationId: membership.org_id,
        role: membership.role
      },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN as any }
    );

    await AuditLogger.log({
      organizationId: membership.org_id,
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id
    });

    return {
      token,
      user: { id: user.id, email: user.email, fullName: user.full_name },
      organization: { id: membership.org_id, name: membership.org_name, role: membership.role }
    };
  }

  public static async getMe(userId: string, organizationId: string) {
    const userRes = await db.query(
      `SELECT u.id, u.email, u.full_name, m.role, o.id as org_id, o.name as org_name, o.tier
       FROM users u
       JOIN organization_memberships m ON m.user_id = u.id AND m.organization_id = $2
       JOIN organizations o ON o.id = m.organization_id
       WHERE u.id = $1`,
      [userId, organizationId]
    );

    if (userRes.rows.length === 0) {
      throw { status: 404, message: 'User or membership not found.' };
    }

    const row = userRes.rows[0];
    return {
      user: { id: row.id, email: row.email, fullName: row.full_name },
      organization: { id: row.org_id, name: row.org_name, tier: row.tier, role: row.role }
    };
  }
}
