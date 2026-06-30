import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../auth/types';

/**
 * Middleware factory untuk Role-Based Access Control.
 *
 * Penggunaan:
 *   router.get('/laporan', requireAuth, requireRole('admin'), handler)
 *   router.get('/materi',  requireAuth, requireRole('siswa', 'tutor'), handler)
 *
 * requireAuth wajib dipasang sebelum requireRole karena requireRole
 * bergantung pada req.user yang diisi oleh requireAuth.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      // Seharusnya tidak terjadi jika requireAuth dipasang terlebih dahulu
      res.status(401).json({ error: 'Autentikasi diperlukan' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Anda tidak memiliki izin untuk mengakses endpoint ini',
      });
      return;
    }

    next();
  };
}
