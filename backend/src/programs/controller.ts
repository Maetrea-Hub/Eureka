import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import * as service from './service';

export const programsRouter = Router();

// ── Zod schemas ───────────────────────────────────────────────

const MAPEL = [
  'ipa_terpadu', 'matematika', 'b_inggris', 'biologi', 'fisika', 'kimia',
] as const;

const ProgramSchema = z.object({
  nama:           z.string().min(2, 'Minimal 2 karakter').max(200),
  tipe_layanan:   z.enum(['private', 'small_class', 'regular_class'] as const),
  jenjang:        z.enum(['SD', 'SMP', 'SMA'] as const),
  mata_pelajaran: z.array(z.enum(MAPEL)).min(1, 'Pilih minimal 1 mata pelajaran'),
  durasi:         z.string().min(1, 'Durasi wajib diisi'),
  kapasitas:      z.number().int('Harus bilangan bulat').min(1, 'Minimal 1'),
  tarif:          z.number().min(0, 'Tarif tidak boleh negatif'),
  status:         z.boolean().optional(),
});

const ProgramUpdateSchema = ProgramSchema.partial();

const StatusSchema = z.object({
  status: z.boolean(),
});

// ── GET /api/programs ─────────────────────────────────────────

programsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const filters = {
      jenjang:      req.query.jenjang as string | undefined,
      tipe_layanan: req.query.tipe   as string | undefined,
      status:       req.query.status !== undefined
        ? req.query.status === 'true'
        : undefined,
    };
    const programs = await service.listPrograms(filters);
    res.json(programs);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Gagal memuat program' });
  }
});

// ── GET /api/programs/:id ─────────────────────────────────────

programsRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const program = await service.getProgramById(req.params['id'] as string);
    res.json(program);
  } catch (err) {
    res.status(404).json({ error: err instanceof Error ? err.message : 'Program tidak ditemukan' });
  }
});

// ── POST /api/programs ────────────────────────────────────────

programsRouter.post(
  '/',
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    const parsed = ProgramSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      const program = await service.createProgram(
        { ...parsed.data, status: parsed.data.status ?? true },
        req.user!.id,
      );
      res.status(201).json(program);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Gagal membuat program' });
    }
  },
);

// ── PUT /api/programs/:id ─────────────────────────────────────

programsRouter.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    const parsed = ProgramUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      const program = await service.updateProgram(req.params['id'] as string, parsed.data, req.user!.id);
      res.json(program);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal update program';
      const status = msg.includes('sedang aktif') ? 409 : 400;
      res.status(status).json({ error: msg });
    }
  },
);

// ── PATCH /api/programs/:id/status ───────────────────────────

programsRouter.patch(
  '/:id/status',
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    const parsed = StatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      const program = await service.toggleStatus(req.params['id'] as string, parsed.data.status);
      res.json(program);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Gagal update status' });
    }
  },
);

// ── DELETE /api/programs/:id ──────────────────────────────────

programsRouter.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      await service.deleteProgram(req.params['id'] as string, req.user!.id);
      res.status(204).send();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal hapus program';
      const status = msg.includes('sedang aktif') ? 409 : 400;
      res.status(status).json({ error: msg });
    }
  },
);
