import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { supabase } from '../lib/supabase';
import { decryptAES, encryptAES } from '../lib/crypto';
import { getWhatsAppProvider } from '../lib/whatsapp';
import * as notifService from '../notifications/service';
import type { SendMessageResult } from '../lib/whatsapp/interface';
import * as repo from './repository';
import type {
  AdminLoginStep1Payload,
  AdminLoginStep1Result,
  AdminLoginStep2Payload,
  AdminLoginStep2Result,
  OnboardingPayload,
  RegisterSiswaPayload,
} from './types';

const BCRYPT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES ?? '5', 10);

// randomInt dari Node.js crypto adalah cryptographically secure
function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

// Retry 1x dengan delay pendek untuk alur sinkron OTP login.
// Retry 5 menit (per CLAUDE.md spec) berlaku untuk notification service
// yang berjalan secara async — bukan untuk OTP yang menunggu response HTTP.
async function sendWaWithRetry(
  to: string,
  message: string,
): Promise<SendMessageResult> {
  const wa = getWhatsAppProvider();
  const first = await wa.sendMessage(to, message);
  if (first.success) return first;

  await new Promise(r => setTimeout(r, 3_000));
  return wa.sendMessage(to, message);
}

// ── Registrasi Siswa ──────────────────────────────────────────

export async function registerSiswa(payload: RegisterSiswaPayload): Promise<void> {
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        // raw_user_meta_data ini dibaca oleh trigger handle_new_user di DB.
        // Password di-hash oleh Supabase Auth secara internal — tidak perlu bcrypt di sini.
        nama_lengkap: payload.nama_lengkap,
        role: 'siswa',
      },
    },
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Registrasi gagal — user tidak ditemukan');

  // Trigger handle_new_user telah membuat row profiles dengan nama_lengkap dan role='siswa'.
  // Update kolom tambahan yang tidak bisa diset via trigger.
  await repo.updateProfile(data.user.id, {
    nomor_whatsapp: payload.nomor_whatsapp,
    jenjang_sekolah: payload.jenjang_sekolah,
  });

  // Notifikasi verifikasi_email: WA + in-app (service role bypasses RLS)
  void notifService.dispatch(
    data.user.id,
    payload.nomor_whatsapp,
    'verifikasi_email',
    { nama_siswa: payload.nama_lengkap, email: payload.email },
  );
}

// ── Admin Login Step 1: verifikasi credentials, kirim OTP WA ─

export async function adminLoginStep1(
  payload: AdminLoginStep1Payload,
  clientIp?: string,
): Promise<AdminLoginStep1Result> {
  // Bersihkan OTP expired di awal setiap percobaan login
  await repo.cleanupExpiredOtpSessions();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (authError || !authData.session) {
    throw new Error('Email atau password salah');
  }

  const profile = await repo.findProfileById(authData.user.id);

  // Samakan pesan error untuk non-admin dan wrong credentials —
  // jangan bocorkan bahwa akun ada tapi bukan admin
  if (!profile || profile.role !== 'admin') {
    throw new Error('Email atau password salah');
  }

  if (!profile.nomor_whatsapp) {
    throw new Error('Nomor WhatsApp Admin belum dikonfigurasi. Hubungi super admin.');
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);

  // Simpan Supabase tokens dalam bentuk terenkripsi — tidak pernah plain text di DB
  const encryptedAccess = encryptAES(authData.session.access_token);
  const encryptedRefresh = encryptAES(authData.session.refresh_token);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60_000).toISOString();

  const { temp_token } = await repo.createOtpSession({
    admin_id: profile.id,
    otp_hash: otpHash,
    encrypted_access_token: encryptedAccess,
    encrypted_refresh_token: encryptedRefresh,
    expires_at: expiresAt,
    created_from_ip: clientIp,
  });

  const waMessage =
    `[Eureka Bimbel] Kode OTP login Admin Anda: *${otp}*\n` +
    `Berlaku ${OTP_EXPIRY_MINUTES} menit. Jangan bagikan kode ini ke siapapun.`;

  const waResult = await sendWaWithRetry(profile.nomor_whatsapp, waMessage);
  if (!waResult.success) {
    throw new Error(`Gagal mengirim OTP ke WhatsApp: ${waResult.error}`);
  }

  return {
    temp_token,
    wa_preview: profile.nomor_whatsapp.slice(-4),
  };
}

// ── Admin Login Step 2: verifikasi OTP, kembalikan session ───

export async function adminLoginStep2(
  payload: AdminLoginStep2Payload,
): Promise<AdminLoginStep2Result> {
  const session = await repo.findValidOtpSession(payload.temp_token);
  if (!session) {
    throw new Error('OTP tidak valid atau sudah kedaluwarsa');
  }

  const isValid = await bcrypt.compare(payload.otp, session.otp_hash);
  if (!isValid) {
    // Increment dulu sebelum throw agar gagal selalu tercatat,
    // bahkan jika ada error setelahnya
    const attempts = await repo.incrementOtpAttempts(session.id);
    const remaining = 5 - attempts;

    if (remaining <= 0) {
      throw new Error('OTP salah terlalu banyak. Silakan login ulang untuk mendapatkan OTP baru.');
    }
    throw new Error(`Kode OTP salah. ${remaining} percobaan tersisa.`);
  }

  // Tandai sebagai sudah digunakan sebelum dekripsi — cegah race condition reuse
  await repo.markOtpSessionUsed(session.id);

  const accessToken = decryptAES(session.encrypted_access_token);
  const refreshToken = decryptAES(session.encrypted_refresh_token);

  const profile = await repo.findProfileById(session.admin_id);
  if (!profile) throw new Error('Profil Admin tidak ditemukan');

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: {
      id: profile.id,
      role: profile.role,
      nama_lengkap: profile.nama_lengkap,
    },
  };
}

// ── Onboarding ────────────────────────────────────────────────

export async function completeOnboarding(
  userId: string,
  payload: OnboardingPayload,
): Promise<void> {
  await repo.updateProfile(userId, {
    ...payload,
    onboarding_completed: true,
  });
}

export async function completeGoogleOnboarding(
  userId: string,
  payload: { nomor_whatsapp: string; jenjang_sekolah: 'SD' | 'SMP' | 'SMA' },
): Promise<void> {
  await repo.updateProfile(userId, {
    ...payload,
    onboarding_completed: true,
  });
}

// ── Ubah Password ─────────────────────────────────────────────

export async function changePassword(
  userId:      string,
  newPassword: string,
): Promise<void> {
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });
  if (error) throw new Error(error.message);

  const profile = await repo.findProfileById(userId);
  if (profile) {
    void notifService.dispatch(
      userId,
      profile.nomor_whatsapp,
      'password_diubah',
      { nama_siswa: profile.nama_lengkap },
    );
  }
}
