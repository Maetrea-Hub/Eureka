import { supabase } from '../lib/supabase.js';
import type { Enrollment, EnrollmentCreateInput } from './types.js';

export async function create(data: EnrollmentCreateInput): Promise<Enrollment> {
  const { data: enrollment, error } = await supabase
    .from('enrollments')
    .insert(data)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return enrollment as Enrollment;
}

export async function findBySiswa(siswaId: string): Promise<Enrollment[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, programs!inner(id, nama, tipe_layanan, jenjang, mata_pelajaran, durasi, tarif)')
    .eq('siswa_id', siswaId)
    .order('enrolled_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Enrollment[];
}

export async function isEnrolled(siswaId: string, programId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('siswa_id', siswaId)
    .eq('program_id', programId)
    .eq('status', 'active');
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function countAllBySiswa(siswaId: string): Promise<number> {
  const { count, error } = await supabase
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('siswa_id', siswaId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function updateStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase.from('enrollments').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function updateStatusByOrderId(orderId: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('enrollments')
    .update({ status })
    .eq('order_id', orderId);
  if (error) throw new Error(error.message);
}
