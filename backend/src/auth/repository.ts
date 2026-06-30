import { supabase } from '../lib/supabase';
import type { AdminOtpSession, Profile } from './types';

export async function findProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

export async function updateProfile(
  id: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id);

  if (error) throw new Error(`Gagal update profile: ${error.message}`);
}

// ── OTP Sessions ──────────────────────────────────────────────

export async function createOtpSession(params: {
  admin_id: string;
  otp_hash: string;
  encrypted_access_token: string;
  encrypted_refresh_token: string;
  expires_at: string;
  created_from_ip?: string;
}): Promise<{ temp_token: string }> {
  // Hapus pending session lama milik admin ini sebelum buat yang baru.
  // Memastikan hanya ada satu OTP aktif per admin pada satu waktu.
  await supabase
    .from('admin_otp_sessions')
    .delete()
    .eq('admin_id', params.admin_id)
    .eq('used', false);

  const { data, error } = await supabase
    .from('admin_otp_sessions')
    .insert(params)
    .select('temp_token')
    .single();

  if (error || !data) {
    throw new Error(`Gagal membuat OTP session: ${error?.message}`);
  }
  return data as { temp_token: string };
}

const MAX_OTP_ATTEMPTS = 5;

export async function findValidOtpSession(
  tempToken: string,
): Promise<AdminOtpSession | null> {
  const { data, error } = await supabase
    .from('admin_otp_sessions')
    .select('*')
    .eq('temp_token', tempToken)
    .eq('used', false)
    .lt('otp_attempts', MAX_OTP_ATTEMPTS)   // otomatis invalid setelah 5x salah
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) return null;
  return data as AdminOtpSession;
}

export async function markOtpSessionUsed(id: string): Promise<void> {
  const { error } = await supabase
    .from('admin_otp_sessions')
    .update({ used: true })
    .eq('id', id);

  if (error) throw new Error(`Gagal menandai OTP session: ${error.message}`);
}

// Increment atomik via DB function — menghindari race condition read-then-write.
// Mengembalikan jumlah percobaan setelah increment.
export async function incrementOtpAttempts(id: string): Promise<number> {
  const { data, error } = await supabase
    .rpc('increment_otp_attempts', { session_id: id });

  if (error) throw new Error(`Gagal increment OTP attempts: ${error.message}`);
  return data as number;
}

export async function cleanupExpiredOtpSessions(): Promise<void> {
  await supabase.rpc('cleanup_expired_otp_sessions');
}
