import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import type { TenantRequest } from './tenantContext.js';

export interface JwtPayload {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
}

export function requireAuth(req: TenantRequest, res: Response, next: NextFunction): void {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: { message: 'Authentication required. Missing Bearer token.', code: 'UNAUTHORIZED' } });
    return;
  }

  const token = authHeader.substring(7).trim();
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    req.tenantId = decoded.organizationId;
    next();
  } catch (err: any) {
    res.status(401).json({ error: { message: 'Invalid or expired authentication token.', code: 'INVALID_TOKEN' } });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: TenantRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: { message: 'Authentication required.', code: 'UNAUTHORIZED' } });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
          code: 'FORBIDDEN'
        }
      });
      return;
    }

    next();
  };
}
