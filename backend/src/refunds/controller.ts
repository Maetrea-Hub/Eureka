import { Router, type Request, type Response } from 'express';
import { requireAuth, requireRole } from '../auth/middleware.js';
import * as service from './service.js';

export const refundsRouter = Router();

function errStatus(msg: string): number {
  if (msg.includes('tidak ditemukan')) return 404;
  if (msg.includes('tidak berhak'))    return 403;
  if (msg.includes('sudah'))           return 409;
  return 400;
}

// POST /api/refunds/request — siswa ajukan refund
refundsRouter.post('/request', requireAuth, requireRole('siswa'), async (req: Request, res: Response) => {
  try {
    const { order_id, alasan } = req.body as { order_id?: string; alasan?: string };
    if (!order_id || !alasan) {
      return void res.status(400).json({ error: 'order_id dan alasan wajib diisi' });
    }
    const refund = await service.requestRefund(req.user!.id, order_id, alasan);
    res.status(201).json(refund);
  } catch (err) {
    const msg = (err as Error).message;
    res.status(errStatus(msg)).json({ error: msg });
  }
});

// POST /api/refunds/force-majeure — admin: force refund tanpa window check
refundsRouter.post('/force-majeure', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { order_id, alasan } = req.body as { order_id?: string; alasan?: string };
    if (!order_id || !alasan) {
      return void res.status(400).json({ error: 'order_id dan alasan wajib diisi' });
    }
    const refund = await service.forceRefund(req.user!.id, order_id, alasan);
    res.status(201).json(refund);
  } catch (err) {
    const msg = (err as Error).message;
    res.status(errStatus(msg)).json({ error: msg });
  }
});

// PATCH /api/refunds/:id/process — admin: approve atau reject
refundsRouter.patch('/:id/process', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { action } = req.body as { action?: 'approved' | 'rejected' };
    if (action !== 'approved' && action !== 'rejected') {
      return void res.status(400).json({ error: 'action harus "approved" atau "rejected"' });
    }
    const refund = await service.processRefund(req.params.id, req.user!.id, action);
    res.json(refund);
  } catch (err) {
    const msg = (err as Error).message;
    res.status(errStatus(msg)).json({ error: msg });
  }
});

// GET /api/refunds — siswa: own; admin: all
refundsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const refunds = await service.listRefunds(req.user!.id, req.user!.role);
    res.json(refunds);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
