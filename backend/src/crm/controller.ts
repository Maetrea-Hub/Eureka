import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import * as service from './service.js';

export const crmRouter = Router();

const NoteSchema = z.object({
  catatan: z.string().min(1, 'Catatan tidak boleh kosong').max(2000),
});

// GET /api/crm/students
crmRouter.get(
  '/students',
  requireAuth,
  requireRole('admin'),
  async (_req: Request, res: Response) => {
    try {
      res.json(await service.listStudents());
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Gagal memuat daftar siswa' });
    }
  },
);

// GET /api/crm/students/:siswaId/notes
crmRouter.get(
  '/students/:siswaId/notes',
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      res.json(await service.listNotes(req.params['siswaId'] as string));
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Gagal memuat catatan' });
    }
  },
);

// POST /api/crm/students/:siswaId/notes
crmRouter.post(
  '/students/:siswaId/notes',
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    const parsed = NoteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      const note = await service.addNote(
        req.params['siswaId'] as string,
        req.user!.id,
        parsed.data,
      );
      res.status(201).json(note);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Gagal tambah catatan' });
    }
  },
);

// PATCH /api/crm/notes/:noteId
crmRouter.patch(
  '/notes/:noteId',
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    const parsed = NoteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      res.json(await service.editNote(req.params['noteId'] as string, parsed.data.catatan));
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Gagal update catatan' });
    }
  },
);

// DELETE /api/crm/notes/:noteId
crmRouter.delete(
  '/notes/:noteId',
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      await service.removeNote(req.params['noteId'] as string);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Gagal hapus catatan' });
    }
  },
);
