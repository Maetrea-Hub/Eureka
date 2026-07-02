import { supabase } from '../lib/supabase.js';
import type { CrmStudent, CrmNote, CreateNoteInput } from './types.js';

export async function findStudents(): Promise<CrmStudent[]> {
  const [
    { data: profiles },
    { data: enrollments },
    { data: notes },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, nama_lengkap, email, nomor_whatsapp, created_at')
      .eq('role', 'siswa')
      .order('created_at', { ascending: false }),
    supabase.from('enrollments').select('siswa_id').eq('status', 'active'),
    supabase.from('crm_notes').select('siswa_id'),
  ]);

  const enrollMap: Record<string, number> = {};
  for (const e of enrollments ?? []) {
    enrollMap[e.siswa_id as string] = (enrollMap[e.siswa_id as string] ?? 0) + 1;
  }
  const noteMap: Record<string, number> = {};
  for (const n of notes ?? []) {
    noteMap[n.siswa_id as string] = (noteMap[n.siswa_id as string] ?? 0) + 1;
  }

  return (profiles ?? []).map(p => ({
    id:               p.id as string,
    nama_lengkap:     p.nama_lengkap as string,
    email:            p.email as string,
    nomor_whatsapp:   p.nomor_whatsapp as string | null,
    created_at:       p.created_at as string,
    enrollment_count: enrollMap[p.id as string] ?? 0,
    note_count:       noteMap[p.id as string]   ?? 0,
  }));
}

export async function findNotes(siswaId: string): Promise<CrmNote[]> {
  const { data, error } = await supabase
    .from('crm_notes')
    .select('*, admin:admin_id(nama_lengkap)')
    .eq('siswa_id', siswaId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CrmNote[];
}

export async function createNote(
  siswaId: string,
  adminId: string,
  input:   CreateNoteInput,
): Promise<CrmNote> {
  const { data, error } = await supabase
    .from('crm_notes')
    .insert({ siswa_id: siswaId, admin_id: adminId, catatan: input.catatan })
    .select('*, admin:admin_id(nama_lengkap)')
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as CrmNote;
}

export async function updateNote(noteId: string, catatan: string): Promise<CrmNote> {
  const { data, error } = await supabase
    .from('crm_notes')
    .update({ catatan, updated_at: new Date().toISOString() })
    .eq('id', noteId)
    .select('*, admin:admin_id(nama_lengkap)')
    .single();
  if (error || !data) throw new Error('Catatan tidak ditemukan');
  return data as unknown as CrmNote;
}

export async function deleteNote(noteId: string): Promise<void> {
  const { error } = await supabase.from('crm_notes').delete().eq('id', noteId);
  if (error) throw new Error(error.message);
}
