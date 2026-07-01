import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import * as service from './service.js';

export const schedulesRouter = Router();

// ── Zod schemas ───────────────────────────────────────────────

const ScheduleSchema = z.object({
  program_id:  z.string().uuid(),
  judul_kelas: z.string().min(3).max(200),
  tanggal:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  jam_mulai:   z.string().regex(/^\d{2}:\d{2}$/),
  jam_selesai: z.string().regex(/^\d{2}:\d{2}$/),
});

const UpdateSchema = ScheduleSchema.partial();

const CancelSchema = z.object({
  cancel_reason: z.string().max(500).optional(),
});

const RescheduleSchema = z.object({
  tanggal:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  jam_mulai:   z.string().regex(/^\d{2}:\d{2}$/),
  jam_selesai: z.string().regex(/^\d{2}:\d{2}$/),
});

// ── Helpers ───────────────────────────────────────────────────

function errStatus(msg: string): number {
  if (msg.includes('tidak ditemukan'))   return 404;
  if (msg.includes('tidak berhak'))      return 403;
  if (msg.includes('sudah') || msg.includes('tidak bisa')) return 409;
  if (msg.includes('tidak aktif') || msg.includes('belum tersedia') || msg.includes('tidak terdaftar')) return 400;
  return 500;
}

// ── Routes ────────────────────────────────────────────────────

// GET /api/schedules
schedulesRouter.get('/', requireAuth, async (req, res) => {
  try {
    const filters = {
      status:       req.query['status'] as string | undefined,
      tutor_id:     req.query['tutor_id'] as string | undefined,
      program_id:   req.query['program_id'] as string | undefined,
      tanggal_from: req.query['tanggal_from'] as string | undefined,
      tanggal_to:   req.query['tanggal_to'] as string | undefined,
    } as Parameters<typeof service.listSchedules>[0];

    const data = await service.listSchedules(filters, req.user!.id, req.user!.role);
    res.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'internal error';
    res.status(500).json({ error: msg });
  }
});

// GET /api/schedules/:id
schedulesRouter.get('/:id', requireAuth, async (req, res) => {
  try {
    const data = await service.getSchedule(req.params['id'] as string, req.user!.id, req.user!.role);
    res.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'internal error';
    res.status(errStatus(msg)).json({ error: msg });
  }
});

// GET /api/schedules/:id/join — siswa, triggers absensi
schedulesRouter.get('/:id/join', requireAuth, requireRole('siswa'), async (req, res) => {
  try {
    const data = await service.joinClass(req.params['id'] as string, req.user!.id);
    res.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'internal error';
    res.status(errStatus(msg)).json({ error: msg });
  }
});

// GET /api/schedules/:id/attendances — tutor/admin
schedulesRouter.get(
  '/:id/attendances',
  requireAuth,
  requireRole('tutor', 'admin'),
  async (req, res) => {
    try {
      const data = await service.getAttendances(
        req.params['id'] as string,
        req.user!.id,
        req.user!.role,
      );
      res.json(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'internal error';
      res.status(errStatus(msg)).json({ error: msg });
    }
  },
);

// POST /api/schedules — tutor/admin
schedulesRouter.post('/', requireAuth, requireRole('tutor', 'admin'), async (req, res) => {
  const parsed = ScheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'invalid input' });
    return;
  }
  try {
    const tutorId = req.user!.role === 'tutor'
      ? req.user!.id
      : (req.body.tutor_id as string | undefined) ?? req.user!.id;
    const data = await service.createSchedule(parsed.data, tutorId);
    res.status(201).json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'internal error';
    res.status(errStatus(msg)).json({ error: msg });
  }
});

// PUT /api/schedules/:id — tutor/admin
schedulesRouter.put('/:id', requireAuth, requireRole('tutor', 'admin'), async (req, res) => {
  const parsed = UpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'invalid input' });
    return;
  }
  try {
    const data = await service.editSchedule(
      req.params['id'] as string,
      parsed.data,
      req.user!.id,
      req.user!.role,
    );
    res.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'internal error';
    res.status(errStatus(msg)).json({ error: msg });
  }
});

// PATCH /api/schedules/:id/cancel — tutor/admin
schedulesRouter.patch(
  '/:id/cancel',
  requireAuth,
  requireRole('tutor', 'admin'),
  async (req, res) => {
    const parsed = CancelSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'invalid input' });
      return;
    }
    try {
      const data = await service.cancelSchedule(
        req.params['id'] as string,
        parsed.data,
        req.user!.id,
        req.user!.role,
      );
      res.json(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'internal error';
      res.status(errStatus(msg)).json({ error: msg });
    }
  },
);

// PATCH /api/schedules/:id/reschedule — tutor/admin
schedulesRouter.patch(
  '/:id/reschedule',
  requireAuth,
  requireRole('tutor', 'admin'),
  async (req, res) => {
    const parsed = RescheduleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'invalid input' });
      return;
    }
    try {
      const data = await service.rescheduleSchedule(
        req.params['id'] as string,
        parsed.data,
        req.user!.id,
        req.user!.role,
      );
      res.json(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'internal error';
      res.status(errStatus(msg)).json({ error: msg });
    }
  },
);

// PATCH /api/schedules/:id/end — tutor/admin, mark selesai + batch tidak_hadir
schedulesRouter.patch(
  '/:id/end',
  requireAuth,
  requireRole('tutor', 'admin'),
  async (req, res) => {
    try {
      const data = await service.endSchedule(
        req.params['id'] as string,
        req.user!.id,
        req.user!.role,
      );
      res.json(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'internal error';
      res.status(errStatus(msg)).json({ error: msg });
    }
  },
);
