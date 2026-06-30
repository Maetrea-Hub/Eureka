import type { NextFunction, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { findProfileById } from '../auth/repository';

/**
 * Middleware: pastikan request memiliki Supabase JWT yang valid.
 * Mengisi req.user = { id, role } untuk dipakai controller dan requireRole.
 *
 * Token dibaca dari header: Authorization: Bearer <access_token>
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token =
    authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Token autentikasi diperlukan' });
    return;
  }

  // Validasi token via Supabase — service role client memverifikasi signature JWT
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    // Bedakan expired vs invalid agar frontend bisa putuskan:
    //   TOKEN_EXPIRED  → coba refresh token otomatis
    //   TOKEN_INVALID  → redirect ke halaman login
    const isExpired =
      error?.message?.toLowerCase().includes('expired') ||
      error?.status === 401;

    res.status(401).json({
      error: isExpired
        ? 'Sesi Anda telah berakhir, silakan login kembali'
        : 'Token tidak valid',
      code: isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
    });
    return;
  }

  const profile = await findProfileById(data.user.id);
  if (!profile) {
    res.status(401).json({ error: 'Profil pengguna tidak ditemukan' });
    return;
  }

  req.user = { id: profile.id, role: profile.role };
  next();
}
