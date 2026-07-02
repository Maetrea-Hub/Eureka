import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as repo from './repository.js';

export const notificationsRouter = Router();

// GET /api/notifications?unread=true
notificationsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const onlyUnread = req.query.unread === 'true';
    const notifications = await repo.findByUser(req.user!.id, onlyUnread);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/notifications/unread-count
notificationsRouter.get('/unread-count', requireAuth, async (req: Request, res: Response) => {
  try {
    const count = await repo.countUnread(req.user!.id);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// PATCH /api/notifications/read-all  (harus sebelum /:id agar tidak ambiguous)
notificationsRouter.patch('/read-all', requireAuth, async (req: Request, res: Response) => {
  try {
    await repo.markAllRead(req.user!.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// PATCH /api/notifications/:id/read
notificationsRouter.patch('/:id/read', requireAuth, async (req: Request, res: Response) => {
  try {
    await repo.markRead(req.params.id, req.user!.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
