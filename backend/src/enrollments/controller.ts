import { Router, type Request, type Response } from 'express';
import { requireAuth, requireRole } from '../auth/middleware.js';
import * as service from './service.js';

export const enrollmentsRouter = Router();

// GET /api/enrollments — siswa: daftar enrollment sendiri
enrollmentsRouter.get('/', requireAuth, requireRole('siswa'), async (req: Request, res: Response) => {
  try {
    const enrollments = await service.listEnrollments(req.user!.id);
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
