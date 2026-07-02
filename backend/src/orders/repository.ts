import { supabase } from '../lib/supabase.js';
import type { Order, OrderCreateInput } from './types.js';

export async function create(data: OrderCreateInput): Promise<Order> {
  const { data: order, error } = await supabase
    .from('orders')
    .insert(data)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return order as Order;
}

export async function findById(id: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data as Order;
}

export async function findByMidtransOrderId(midtransOrderId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('midtrans_order_id', midtransOrderId)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data as Order;
}

export async function findBySiswa(siswaId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, programs!inner(nama, tipe_layanan, jenjang)')
    .eq('siswa_id', siswaId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Order[];
}

export async function findAll(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, programs!inner(nama), profiles!siswa_id(nama_lengkap)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Order[];
}

export async function hasPendingOrder(siswaId: string, programId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('siswa_id', siswaId)
    .eq('program_id', programId)
    .eq('status', 'pending');
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function updateStatus(
  id:      string,
  updates: Partial<{
    status:       string;
    payment_date: string | null;
    expired_at:   string | null;
  }>,
): Promise<void> {
  const { error } = await supabase.from('orders').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
}
