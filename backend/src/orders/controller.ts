import { Router, type Request, type Response } from 'express';
import { requireAuth, requireRole } from '../auth/middleware.js';
import * as service from './service.js';
import * as repo from './repository.js';

export const ordersRouter = Router();

function errStatus(msg: string): number {
  if (msg.includes('tidak ditemukan') || msg.includes('tidak aktif')) return 404;
  if (msg.includes('sudah terdaftar') || msg.includes('sudah ada order')) return 409;
  return 400;
}

// POST /api/orders — siswa buat order baru
ordersRouter.post('/', requireAuth, requireRole('siswa'), async (req: Request, res: Response) => {
  try {
    const { program_id } = req.body as { program_id?: string };
    if (!program_id) return void res.status(400).json({ error: 'program_id wajib diisi' });

    const order = await service.createOrder(req.user!.id, program_id);
    res.status(201).json(order);
  } catch (err) {
    const msg = (err as Error).message;
    res.status(errStatus(msg)).json({ error: msg });
  }
});

// GET /api/orders — siswa: own orders; admin: all orders
ordersRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (req.user!.role === 'siswa') {
      const orders = await repo.findBySiswa(req.user!.id);
      return void res.json(orders);
    }
    const orders = await repo.findAll();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/orders/:id
ordersRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const order = await repo.findById(req.params.id);
    if (!order) return void res.status(404).json({ error: 'tidak ditemukan' });
    if (req.user!.role === 'siswa' && order.siswa_id !== req.user!.id) {
      return void res.status(403).json({ error: 'tidak berhak' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
