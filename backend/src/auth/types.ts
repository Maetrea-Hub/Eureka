export type UserRole = 'siswa' | 'tutor' | 'admin';

export interface Profile {
  id: string;
  role: UserRole;
  nama_lengkap: string;
  nomor_whatsapp: string | null;
  jenjang_sekolah: 'SD' | 'SMP' | 'SMA' | null;
  foto_url: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminOtpSession {
  id: string;
  admin_id: string;
  temp_token: string;
  otp_hash: string;
  encrypted_access_token: string;
  encrypted_refresh_token: string;
  expires_at: string;
  used: boolean;
  otp_attempts: number;
  created_from_ip: string | null;
  created_at: string;
}

// ── Request payloads (divalidasi Zod di controller) ──────────

export interface RegisterSiswaPayload {
  nama_lengkap: string;
  email: string;
  nomor_whatsapp: string;
  password: string;
  jenjang_sekolah: 'SD' | 'SMP' | 'SMA';
}

export interface AdminLoginStep1Payload {
  email: string;
  password: string;
}

export interface AdminLoginStep2Payload {
  temp_token: string;
  otp: string;
}

export interface OnboardingPayload {
  foto_url?: string;
  jenjang_sekolah: 'SD' | 'SMP' | 'SMA';
  nomor_whatsapp: string;
}

// ── Service return types ──────────────────────────────────────

export interface AdminLoginStep1Result {
  temp_token: string;
  wa_preview: string; // 4 digit terakhir nomor WA (bukan nomor lengkap)
}

export interface AdminLoginStep2Result {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    role: UserRole;
    nama_lengkap: string;
  };
}

// ── Express Request augmentation ─────────────────────────────
// Diisi oleh middleware requireAuth, dibaca controller dan requireRole

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
      };
    }
  }
}
