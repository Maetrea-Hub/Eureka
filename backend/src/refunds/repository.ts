import { supabase } from '../lib/supabase.js';
import type { RefundRequest } from './types.js';

export async function create(data: {
  order_id:       string;
  siswa_id:       string;
  alasan:         string;
  tipe:           string;
  status?:        string;
  diproses_oleh?: string | null;
  diproses_at?:   string | null;
}): Promise<RefundRequest> {
  const { data: refund, error } = await supabase
    .from('refund_requests')
    .insert(data)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return refund as RefundRequest;
}

export async function findAll(): Promise<RefundRequest[]> {
  const { data, error } = await supabase
    .from('refund_requests')
    .select(`
      *,
      orders!inner(id, nominal, program_id, programs!inner(nama)),
      siswa:profiles!siswa_id(nama_lengkap, nomor_whatsapp)
    `)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as RefundRequest[];
}

export async function findBySiswa(siswaId: string): Promise<RefundRequest[]> {
  const { data, error } = await supabase
    .from('refund_requests')
    .select('*, orders!inner(nominal, programs!inner(nama))')
    .eq('siswa_id', siswaId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as RefundRequest[];
}

export async function findById(id: string): Promise<RefundRequest | null> {
  const { data, error } = await supabase
    .from('refund_requests')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data as RefundRequest;
}

export async function findByOrderId(orderId: string): Promise<RefundRequest | null> {
  const { data, error } = await supabase
    .from('refund_requests')
    .select('*')
    .eq('order_id', orderId)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data as RefundRequest;
}

export async function updateStatus(
  id:      string,
  updates: { status: string; diproses_oleh?: string; diproses_at?: string },
): Promise<RefundRequest> {
  const { data, error } = await supabase
    .from('refund_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as RefundRequest;
}
