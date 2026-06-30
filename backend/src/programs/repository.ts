import { supabase } from '../lib/supabase';
import type { Program, ProgramInput } from './types';

export interface ProgramFilters {
  jenjang?:      string;
  tipe_layanan?: string;
  status?:       boolean;
}

export async function findAll(filters: ProgramFilters = {}): Promise<Program[]> {
  let query = supabase
    .from('programs')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.jenjang)      query = query.eq('jenjang', filters.jenjang);
  if (filters.tipe_layanan) query = query.eq('tipe_layanan', filters.tipe_layanan);
  if (filters.status !== undefined) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Program[];
}

export async function findById(id: string): Promise<Program | null> {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data as Program;
}

export async function create(input: ProgramInput): Promise<Program> {
  const { data, error } = await supabase
    .from('programs')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Program;
}

export async function update(
  id: string,
  input: Partial<ProgramInput>,
): Promise<Program> {
  const { data, error } = await supabase
    .from('programs')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Program;
}

export async function remove(id: string): Promise<void> {
  const { error } = await supabase
    .from('programs')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ─────────────────────────────────────────────────────────────
// KNOWN GAP — Blok 12 (Enrollments)
//
// Fungsi ini saat ini selalu return false karena tabel
// `enrollments` belum diimplementasikan.
//
// UPDATE DI BLOK 12: ganti body dengan —
//   const { count } = await supabase
//     .from('enrollments')
//     .select('id', { count: 'exact', head: true })
//     .eq('program_id', id)
//     .eq('status', 'active');
//   return (count ?? 0) > 0;
// ─────────────────────────────────────────────────────────────
export async function isInUse(_id: string): Promise<boolean> {
  return false;
}
