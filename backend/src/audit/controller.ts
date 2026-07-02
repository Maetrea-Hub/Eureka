import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import * as service from './service.js';
import { AUDIT_ACTIONS } from './repository.js';

export const auditRouter = Router();

// GET /api/audit — list audit logs dengan filter
auditRouter.get(
  '/',
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { action, from, to, limit, offset } = req.query as Record<string, string | undefined>;
      const logs = await service.listAuditLogs({
        action: action || undefined,
        from:   from   || undefined,
        to:     to     || undefined,
        limit:  limit  ? parseInt(limit,  10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      });
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Gagal memuat audit log' });
    }
  },
);

// GET /api/audit/actions — enum action untuk dropdown filter
auditRouter.get(
  '/actions',
  requireAuth,
  requireRole('admin'),
  (_req: Request, res: Response) => {
    res.json(AUDIT_ACTIONS);
  },
);
