import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { loginEmailRateLimiter, loginRateLimiter } from '../middleware/rate-limit';
import * as service from './service';

export const authRouter = Router();

// ── Zod schemas ───────────────────────────────────────────────

const waRegex = /^628\d{8,11}$/;

const RegisterSchema = z.object({
  nama_lengkap:    z.string().min(2).max(100),
  email:           z.string().email(),
  nomor_whatsapp:  z.string().regex(waRegex, 'Format: 628xxxxxxxx (tanpa + atau 0 di depan)'),
  password:        z.string().min(8).max(72),
  jenjang_sekolah: z.enum(['SD', 'SMP', 'SMA']),
});

const AdminStep1Schema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

const AdminStep2Schema = z.object({
  temp_token: z.string().uuid(),
  otp:        z.string().regex(/^\d{6}$/, 'OTP harus tepat 6 digit angka'),
});

const OnboardingSchema = z.object({
  foto_url:        z.string().url().optional(),
  jenjang_sekolah: z.enum(['SD', 'SMP', 'SMA']),
  nomor_whatsapp:  z.string().regex(waRegex, 'Format: 628xxxxxxxx'),
});

const GoogleOnboardingSchema = z.object({
  nomor_whatsapp:  z.string().regex(waRegex, 'Format: 628xxxxxxxx'),
  jenjang_sekolah: z.enum(['SD', 'SMP', 'SMA']),
});

// ── Helper ────────────────────────────────────────────────────

function clientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim() ??
    req.socket.remoteAddress ??
    'unknown'
  );
}

// ── POST /api/auth/register ───────────────────────────────────

authRouter.post('/register', async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    await service.registerSiswa(parsed.data);
    res.status(201).json({ message: 'Registrasi berhasil. Cek email Anda untuk verifikasi.' });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Registrasi gagal' });
  }
});

// ── POST /api/auth/admin/login — Step 1 ──────────────────────
// Dua limiter diterapkan berurutan:
//   loginRateLimiter      → 5x per IP+email / 15 menit
//   loginEmailRateLimiter → 10x per email / 15 menit (jaring dari rotasi IP)

authRouter.post('/admin/login', loginRateLimiter, loginEmailRateLimiter, async (req: Request, res: Response) => {
  const parsed = AdminStep1Schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    const result = await service.adminLoginStep1(parsed.data, clientIp(req));
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err instanceof Error ? err.message : 'Login gagal' });
  }
});

// ── POST /api/auth/admin/verify-otp — Step 2 ─────────────────

authRouter.post('/admin/verify-otp', loginRateLimiter, async (req: Request, res: Response) => {
  const parsed = AdminStep2Schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    const result = await service.adminLoginStep2(parsed.data);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err instanceof Error ? err.message : 'Verifikasi OTP gagal' });
  }
});

// ── POST /api/auth/onboarding ─────────────────────────────────
// Setelah verifikasi email — isi foto, sekolah, kelas, minat

authRouter.post('/onboarding', requireAuth, async (req: Request, res: Response) => {
  const parsed = OnboardingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    await service.completeOnboarding(req.user!.id, parsed.data);
    res.json({ message: 'Onboarding selesai' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Onboarding gagal' });
  }
});

// ── POST /api/auth/onboarding/google ─────────────────────────
// Setelah Google OAuth pertama kali — isi nomor WA + jenjang

authRouter.post('/onboarding/google', requireAuth, async (req: Request, res: Response) => {
  const parsed = GoogleOnboardingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    await service.completeGoogleOnboarding(req.user!.id, parsed.data);
    res.json({ message: 'Onboarding Google selesai' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Onboarding gagal' });
  }
});

// ── POST /api/auth/change-password ───────────────────────────

const ChangePasswordSchema = z.object({
  password: z.string().min(8, 'Minimal 8 karakter').max(72),
});

authRouter.post('/change-password', requireAuth, async (req: Request, res: Response) => {
  const parsed = ChangePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    await service.changePassword(req.user!.id, parsed.data.password);
    res.json({ message: 'Password berhasil diubah' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Gagal mengubah password' });
  }
});
