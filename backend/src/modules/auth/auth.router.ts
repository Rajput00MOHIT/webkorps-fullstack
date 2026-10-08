import { Router } from 'express';
import type { Response } from 'express';
import { AuthService } from './authService.js';
import { requireAuth } from '../../middleware/auth.js';
import type { TenantRequest } from '../../middleware/tenantContext.js';

export const authRouter = Router();

authRouter.post('/register', async (req, res, next) => {
  try {
    const { email, password, fullName, organizationName } = req.body;
    if (!email || !password || !fullName) {
      res.status(400).json({ error: { message: 'email, password, and fullName are required.' } });
      return;
    }
    const result = await AuthService.register({ email, password, fullName, organizationName });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: { message: 'email and password are required.' } });
      return;
    }
    const result = await AuthService.login({ email, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Successfully logged out.' });
});

authRouter.get('/me', requireAuth, async (req: TenantRequest, res: Response, next) => {
  try {
    const result = await AuthService.getMe(req.user!.id, req.tenantId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
