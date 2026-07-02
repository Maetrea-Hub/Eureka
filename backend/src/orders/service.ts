import { supabase } from '../lib/supabase.js';
import * as repo from './repository.js';
import { createSnapToken } from '../lib/midtrans/midtrans-client.js';
import type { Order } from './types.js';

export async function createOrder(siswaId: string, programId: string): Promise<Order> {
  // Cek active enrollment — tidak boleh beli program yang sama dua kali
  const { count: activeCount } = await supabase
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('siswa_id', siswaId)
    .eq('program_id', programId)
    .eq('status', 'active');

  if ((activeCount ?? 0) > 0) {
    throw new Error('sudah terdaftar aktif di program ini');
  }

  // Cek pending order — satu order pending per program cukup
  const hasPending = await repo.hasPendingOrder(siswaId, programId);
  if (hasPending) {
    throw new Error('sudah ada order pending untuk program ini, selesaikan pembayaran atau tunggu expired');
  }

  // Get program (harus aktif)
  const { data: program, error: programErr } = await supabase
    .from('programs')
    .select('id, nama, tarif')
    .eq('id', programId)
    .eq('status', true)
    .single();

  if (programErr || !program) {
    throw new Error('program tidak ditemukan atau tidak aktif');
  }

  // Get profil siswa untuk customer_details Midtrans
  const { data: profile } = await supabase
    .from('profiles')
    .select('nama_lengkap, nomor_whatsapp')
    .eq('id', siswaId)
    .single();

  // Generate unique order ID untuk Midtrans
  const midtransOrderId  = `EUREKA-${programId.slice(0, 8)}-${siswaId.slice(0, 8)}-${Date.now()}`;
  const orderExpiresAt   = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const snap = await createSnapToken({
    transaction_details: {
      order_id:     midtransOrderId,
      gross_amount: Number(program.tarif),
    },
    customer_details: {
      first_name: profile?.nama_lengkap ?? 'Siswa',
      ...(profile?.nomor_whatsapp ? { phone: profile.nomor_whatsapp } : {}),
    },
    expiry: { unit: 'hours', duration: 24 },
  });

  return repo.create({
    siswa_id:          siswaId,
    program_id:        programId,
    midtrans_order_id: midtransOrderId,
    snap_token:        snap.token,
    nominal:           Number(program.tarif),
    order_expires_at:  orderExpiresAt,
  });
}
