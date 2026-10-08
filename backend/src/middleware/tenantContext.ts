import type { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/env.js';

export interface TenantRequest extends Request {
  tenantId?: string;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function tenantContextMiddleware(req: TenantRequest, res: Response, next: NextFunction): void {
  // 1. Check custom X-Tenant-ID header
  const headerTenant = req.header('X-Tenant-ID');
  
  if (headerTenant && headerTenant.trim()) {
    req.tenantId = headerTenant.trim();
  } else {
    // 2. Fallback to default dogfood tenant (Webkorps)
    req.tenantId = ENV.DEFAULT_TENANT_ID;
  }
  
  next();
}
