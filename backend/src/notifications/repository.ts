import { supabase } from '../lib/supabase.js';
import type { Notification, NotificationKategori, NotifRecipient } from './types.js';

// ── In-app notification CRUD ──────────────────────────────────

export async function insert(payload: {
  user_id:  string;
  kategori: NotificationKategori;
  judul:    string;
  pesan:    string;
}): Promise<void> {
  const { error } = await supabase.from('notifications').insert(payload);
  if (error) throw new Error(error.message);
}

export async function findByUser(
  userId:     string,
  onlyUnread: boolean,
  limit = 50,
): Promise<Notification[]> {
  let q = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (onlyUnread) q = q.eq('dibaca', false);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Notification[];
}

export async function countUnread(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('dibaca', false);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function markRead(notifId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ dibaca: true })
    .eq('id', notifId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export async function markAllRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ dibaca: true })
    .eq('user_id', userId)
    .eq('dibaca', false);
  if (error) throw new Error(error.message);
}

// ── Recipient lookup helpers ──────────────────────────────────

export async function findAdmins(): Promise<NotifRecipient[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nomor_whatsapp, nama_lengkap')
    .eq('role', 'admin');
  if (error) throw new Error(error.message);
  return (data ?? []) as NotifRecipient[];
}

export async function findTutorsByProgram(programId: string): Promise<NotifRecipient[]> {
  const { data: schedules, error } = await supabase
    .from('schedules')
    .select('tutor_id, profiles!tutor_id(id, nomor_whatsapp, nama_lengkap)')
    .eq('program_id', programId)
    .neq('status', 'dibatalkan');

  if (error || !schedules?.length) return [];

  // Deduplicate by tutor_id
  const seen = new Set<string>();
  const result: NotifRecipient[] = [];
  for (const row of schedules as unknown as Array<{
    tutor_id: string;
    profiles: NotifRecipient;
  }>) {
    if (!seen.has(row.tutor_id)) {
      seen.add(row.tutor_id);
      result.push(row.profiles);
    }
  }
  return result;
}

export async function findEnrolledSiswaForMaterial(
  jenjang:       string,
  mataPelajaran: string,
): Promise<NotifRecipient[]> {
  // Step 1: find programs matching jenjang + mata_pelajaran
  const { data: programs, error: progErr } = await supabase
    .from('programs')
    .select('id')
    .eq('jenjang', jenjang)
    .eq('status', true)
    .contains('mata_pelajaran', [mataPelajaran]);

  if (progErr || !programs?.length) return [];

  const programIds = programs.map((p: { id: string }) => p.id);

  // Step 2: find active enrolled siswa for those programs (deduplicated by siswa_id)
  const { data: enrollments, error: enrollErr } = await supabase
    .from('enrollments')
    .select('siswa_id, profiles!siswa_id(id, nomor_whatsapp, nama_lengkap)')
    .eq('status', 'active')
    .in('program_id', programIds);

  if (enrollErr || !enrollments?.length) return [];

  const seen = new Set<string>();
  const result: NotifRecipient[] = [];
  for (const row of enrollments as unknown as Array<{
    siswa_id: string;
    profiles: NotifRecipient;
  }>) {
    if (!seen.has(row.siswa_id)) {
      seen.add(row.siswa_id);
      result.push(row.profiles);
    }
  }
  return result;
}
