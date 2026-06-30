import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import * as service from './service';

export const materialsRouter = Router();

// ── Zod schemas ───────────────────────────────────────────────

const MAPEL = [
  'ipa_terpadu', 'matematika', 'b_inggris', 'biologi', 'fisika', 'kimia',
] as const;

const OpsiJawabanSchema = z.object({
  text:       z.string().min(1),
  is_correct: z.boolean(),
});

const MaterialSchema = z.object({
  judul:            z.string().min(2).max(300),
  jenjang:          z.enum(['SD', 'SMP', 'SMA'] as const),
  mata_pelajaran:   z.enum(MAPEL),
  topik:            z.string().min(1).max(200),
  tipe:             z.enum(['dokumen', 'video', 'bank_soal'] as const),
  status:           z.enum(['draft', 'published', 'nonaktif'] as const).optional(),
  // dokumen fields
  file_url:         z.string().url().nullable().optional(),
  file_type:        z.enum(['pdf', 'ppt', 'docx', 'epub'] as const).nullable().optional(),
  bisa_download:    z.boolean().optional(),
  // video fields
  video_url:        z.string().url().nullable().optional(),
  duration_seconds: z.number().int().positive().nullable().optional(),
});

const MaterialUpdateSchema = MaterialSchema.omit({ tipe: true }).partial();

const StatusSchema = z.object({
  status: z.enum(['draft', 'published', 'nonaktif'] as const),
});

const QuestionSchema = z.object({
  pertanyaan:          z.string().min(1),
  tipe_soal:           z.enum(['pilihan_ganda', 'essay'] as const),
  opsi_jawaban:        z.array(OpsiJawabanSchema).nullable().optional(),
  pembahasan:          z.string().nullable().optional(),
  ada_timer:           z.boolean().optional(),
  durasi_timer_detik:  z.number().int().positive().nullable().optional(),
  urutan:              z.number().int().min(1).optional(),
});

// ── Helpers ───────────────────────────────────────────────────

function id(req: Request, param: string): string {
  return req.params[param] as string;
}

function requester(req: Request) {
  return { requesterId: req.user!.id, requesterRole: req.user!.role };
}

function errStatus(msg: string): number {
  if (msg.includes('tidak ditemukan')) return 404;
  if (msg.includes('tidak memiliki akses')) return 403;
  if (msg.includes('tidak bisa dihapus') || msg.includes('sedang')) return 409;
  return 400;
}

// ── GET /api/materials ────────────────────────────────────────

materialsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const filters = {
      jenjang:        req.query.jenjang        as string | undefined,
      mata_pelajaran: req.query.mata_pelajaran as string | undefined,
      topik:          req.query.topik          as string | undefined,
      tipe:           req.query.tipe           as string | undefined,
      status:         req.query.status         as string | undefined,
      tutor_id:       req.query.tutor_id       as string | undefined,
    };
    // Tutor hanya melihat materi miliknya kecuali ada filter eksplisit
    if (req.user!.role === 'tutor' && !filters.tutor_id) {
      filters.tutor_id = req.user!.id;
    }
    const materials = await service.listMaterials(filters as Parameters<typeof service.listMaterials>[0]);
    res.json(materials);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Gagal memuat materi' });
  }
});

// ── GET /api/materials/:id ────────────────────────────────────

materialsRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const withQ = req.query.with_questions === 'true';
    const material = await service.getMaterialById(id(req, 'id'), withQ);
    res.json(material);
  } catch (err) {
    res.status(errStatus(err instanceof Error ? err.message : '')).json({
      error: err instanceof Error ? err.message : 'Materi tidak ditemukan',
    });
  }
});

// ── POST /api/materials ───────────────────────────────────────

materialsRouter.post(
  '/',
  requireAuth,
  requireRole('tutor', 'admin'),
  async (req: Request, res: Response) => {
    const parsed = MaterialSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

    try {
      const material = await service.createMaterial({
        ...parsed.data,
        tutor_id: req.user!.id,
        bisa_download: parsed.data.bisa_download ?? false,
      });
      res.status(201).json(material);
    } catch (err) {
      res.status(errStatus(err instanceof Error ? err.message : '')).json({
        error: err instanceof Error ? err.message : 'Gagal membuat materi',
      });
    }
  },
);

// ── PUT /api/materials/:id ────────────────────────────────────

materialsRouter.put(
  '/:id',
  requireAuth,
  requireRole('tutor', 'admin'),
  async (req: Request, res: Response) => {
    const parsed = MaterialUpdateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

    try {
      const { requesterId, requesterRole } = requester(req);
      const material = await service.updateMaterial(id(req, 'id'), parsed.data, requesterId, requesterRole);
      res.json(material);
    } catch (err) {
      res.status(errStatus(err instanceof Error ? err.message : '')).json({
        error: err instanceof Error ? err.message : 'Gagal update materi',
      });
    }
  },
);

// ── PATCH /api/materials/:id/status ──────────────────────────

materialsRouter.patch(
  '/:id/status',
  requireAuth,
  requireRole('tutor', 'admin'),
  async (req: Request, res: Response) => {
    const parsed = StatusSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

    try {
      const { requesterId, requesterRole } = requester(req);
      const material = await service.updateStatus(id(req, 'id'), parsed.data.status, requesterId, requesterRole);
      res.json(material);
    } catch (err) {
      res.status(errStatus(err instanceof Error ? err.message : '')).json({
        error: err instanceof Error ? err.message : 'Gagal update status',
      });
    }
  },
);

// ── DELETE /api/materials/:id ─────────────────────────────────

materialsRouter.delete(
  '/:id',
  requireAuth,
  requireRole('tutor', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const { requesterId, requesterRole } = requester(req);
      await service.deleteMaterial(id(req, 'id'), requesterId, requesterRole);
      res.status(204).send();
    } catch (err) {
      res.status(errStatus(err instanceof Error ? err.message : '')).json({
        error: err instanceof Error ? err.message : 'Gagal hapus materi',
      });
    }
  },
);

// ── GET /api/materials/:id/questions ─────────────────────────

materialsRouter.get('/:id/questions', requireAuth, async (req: Request, res: Response) => {
  try {
    const questions = await service.listQuestions(id(req, 'id'));
    res.json(questions);
  } catch (err) {
    res.status(errStatus(err instanceof Error ? err.message : '')).json({
      error: err instanceof Error ? err.message : 'Gagal memuat soal',
    });
  }
});

// ── POST /api/materials/:id/questions ────────────────────────

materialsRouter.post(
  '/:id/questions',
  requireAuth,
  requireRole('tutor', 'admin'),
  async (req: Request, res: Response) => {
    const parsed = QuestionSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

    try {
      const { requesterId, requesterRole } = requester(req);
      const question = await service.addQuestion(id(req, 'id'), parsed.data, requesterId, requesterRole);
      res.status(201).json(question);
    } catch (err) {
      res.status(errStatus(err instanceof Error ? err.message : '')).json({
        error: err instanceof Error ? err.message : 'Gagal tambah soal',
      });
    }
  },
);

// ── PUT /api/materials/:id/questions/:qid ────────────────────

materialsRouter.put(
  '/:id/questions/:qid',
  requireAuth,
  requireRole('tutor', 'admin'),
  async (req: Request, res: Response) => {
    const parsed = QuestionSchema.partial().safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

    try {
      const { requesterId, requesterRole } = requester(req);
      const question = await service.editQuestion(
        id(req, 'id'), id(req, 'qid'), parsed.data, requesterId, requesterRole,
      );
      res.json(question);
    } catch (err) {
      res.status(errStatus(err instanceof Error ? err.message : '')).json({
        error: err instanceof Error ? err.message : 'Gagal update soal',
      });
    }
  },
);

// ── DELETE /api/materials/:id/questions/:qid ─────────────────

materialsRouter.delete(
  '/:id/questions/:qid',
  requireAuth,
  requireRole('tutor', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const { requesterId, requesterRole } = requester(req);
      await service.deleteQuestion(id(req, 'id'), id(req, 'qid'), requesterId, requesterRole);
      res.status(204).send();
    } catch (err) {
      res.status(errStatus(err instanceof Error ? err.message : '')).json({
        error: err instanceof Error ? err.message : 'Gagal hapus soal',
      });
    }
  },
);
