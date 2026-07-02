import { supabase } from '../lib/supabase';
import type {
  Material, MaterialInput, MaterialFilters,
  Question, QuestionInput,
} from './types';

// ── Materials ─────────────────────────────────────────────────

export async function findAll(filters: MaterialFilters = {}): Promise<Material[]> {
  let query = supabase
    .from('materials')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.jenjang)        query = query.eq('jenjang', filters.jenjang);
  if (filters.mata_pelajaran) query = query.eq('mata_pelajaran', filters.mata_pelajaran);
  if (filters.topik)          query = query.ilike('topik', `%${filters.topik}%`);
  if (filters.tipe)           query = query.eq('tipe', filters.tipe);
  if (filters.status)         query = query.eq('status', filters.status);
  if (filters.tutor_id)       query = query.eq('tutor_id', filters.tutor_id);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Material[];
}

export async function findById(id: string): Promise<Material | null> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data as Material;
}

export async function create(input: MaterialInput): Promise<Material> {
  const { data, error } = await supabase
    .from('materials')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Material;
}

export async function update(
  id: string,
  input: Partial<MaterialInput>,
): Promise<Material> {
  const { data, error } = await supabase
    .from('materials')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Material;
}

export async function remove(id: string): Promise<void> {
  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─────────────────────────────────────────────────────────────
// KNOWN GAP — Blok 12 (material_access tracking)
//
export async function isAccessed(id: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('material_access')
    .select('id', { count: 'exact', head: true })
    .eq('material_id', id);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function upsertAccess(siswaId: string, materialId: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from('material_access').upsert(
    { siswa_id: siswaId, material_id: materialId, last_accessed_at: now },
    { onConflict: 'siswa_id,material_id', ignoreDuplicates: false },
  );
  if (error) throw new Error(error.message);
}

// ── Questions ─────────────────────────────────────────────────

export async function findQuestions(materialId: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('material_id', materialId)
    .order('urutan', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Question[];
}

export async function findQuestionById(id: string): Promise<Question | null> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data as Question;
}

export async function createQuestion(
  materialId: string,
  input: QuestionInput,
): Promise<Question> {
  const { data, error } = await supabase
    .from('questions')
    .insert({ ...input, material_id: materialId })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Question;
}

export async function updateQuestion(
  id: string,
  input: Partial<QuestionInput>,
): Promise<Question> {
  const { data, error } = await supabase
    .from('questions')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Question;
}

export async function removeQuestion(id: string): Promise<void> {
  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
