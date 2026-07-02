import { supabase } from '../lib/supabase.js';
import * as repo from './repository.js';
import * as orderRepo from '../orders/repository.js';
import * as enrollmentRepo from '../enrollments/repository.js';
import * as notifRepo from '../notifications/repository.js';
import * as notifService from '../notifications/service.js';
import { logAudit } from '../audit/service.js';
import type { RefundRequest } from './types.js';

// ── Helper ────────────────────────────────────────────────────

function isWithinRefundWindow(expiredAt: string | null): boolean {
  if (!expiredAt) return false;
  return new Date() <= new Date(expiredAt);
}

// ── Siswa: ajukan refund ──────────────────────────────────────

export async function requestRefund(
  siswaId:  string,
  orderId:  string,
  alasan:   string,
): Promise<RefundRequest> {
  const order = await orderRepo.findById(orderId);
  if (!order) throw new Error('order tidak ditemukan');
  if (order.siswa_id !== siswaId) throw new Error('tidak berhak');
  if (order.status !== 'paid') throw new Error('hanya order dengan status paid yang bisa direfund');

  const existing = await repo.findByOrderId(orderId);
  if (existing) throw new Error('refund request sudah pernah diajukan untuk order ini');

  // Validasi window 48 jam
  if (!isWithinRefundWindow(order.expired_at)) {
    throw new Error('sudah melewati window refund 48 jam sejak tanggal pembayaran');
  }

  // Tentukan tipe: trial_session jika is_first_enrollment pada enrollment-nya
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('is_first_enrollment')
    .eq('order_id', orderId)
    .single();

  const tipe = enrollment?.is_first_enrollment ? 'trial_session' : 'standard';

  const refund = await repo.create({ order_id: orderId, siswa_id: siswaId, alasan, tipe });

  logAudit(siswaId, 'siswa', 'request_refund', 'orders', orderId, { alasan });

  // Notifikasi: refund_masuk ke semua admin
  const { data: siswaProfile } = await supabase
    .from('profiles').select('nama_lengkap').eq('id', siswaId).single();
  const { data: prog } = await supabase
    .from('programs').select('nama').eq('id', order.program_id).single();
  const admins = await notifRepo.findAdmins();
  void notifService.dispatchToMany(admins, 'refund_masuk', () => ({
    nama_siswa:   siswaProfile?.nama_lengkap ?? 'Siswa',
    nama_program: (prog as { nama?: string })?.nama ?? 'Program',
    alasan,
  }));

  return refund;
}

// ── Admin: proses refund (approve/reject) ─────────────────────

export async function processRefund(
  refundId: string,
  adminId:  string,
  action:   'approved' | 'rejected',
): Promise<RefundRequest> {
  const refund = await repo.findById(refundId);
  if (!refund) throw new Error('refund request tidak ditemukan');
  if (refund.status !== 'pending') throw new Error('refund request sudah diproses');

  const now = new Date().toISOString();

  if (action === 'approved') {
    await orderRepo.updateStatus(refund.order_id, { status: 'refunded' });
    await enrollmentRepo.updateStatusByOrderId(refund.order_id, 'refunded');
  }

  const updated = await repo.updateStatus(refundId, {
    status:        action,
    diproses_oleh: adminId,
    diproses_at:   now,
  });

  logAudit(adminId, 'admin', 'process_refund', 'refund_requests', refundId, { action });

  // Notifikasi: refund_diproses ke siswa
  const { data: siswaProfile } = await supabase
    .from('profiles').select('id, nomor_whatsapp, nama_lengkap').eq('id', refund.siswa_id).single();
  const { data: order } = await supabase
    .from('orders').select('program_id').eq('id', refund.order_id).single();
  const { data: prog } = order
    ? await supabase.from('programs').select('nama').eq('id', order.program_id).single()
    : { data: null };

  if (siswaProfile) {
    void notifService.dispatch(
      siswaProfile.id,
      siswaProfile.nomor_whatsapp,
      'refund_diproses',
      {
        nama_siswa:   siswaProfile.nama_lengkap,
        nama_program: (prog as { nama?: string })?.nama ?? 'Program',
        status_refund: action,
      },
    );
  }

  return updated;
}

// ── Admin: force majeure (langsung approved, tanpa window check) ──

export async function forceRefund(
  adminId:  string,
  orderId:  string,
  alasan:   string,
): Promise<RefundRequest> {
  const order = await orderRepo.findById(orderId);
  if (!order) throw new Error('order tidak ditemukan');
  if (order.status !== 'paid') throw new Error('hanya order paid yang bisa diforce refund');

  const existing = await repo.findByOrderId(orderId);
  if (existing) throw new Error('refund request sudah ada untuk order ini');

  const now = new Date().toISOString();

  await orderRepo.updateStatus(orderId, { status: 'refunded' });
  await enrollmentRepo.updateStatusByOrderId(orderId, 'refunded');

  const refund = await repo.create({
    order_id:      orderId,
    siswa_id:      order.siswa_id,
    alasan,
    tipe:          'force_majeure',
    status:        'approved',
    diproses_oleh: adminId,
    diproses_at:   now,
  });

  logAudit(adminId, 'admin', 'force_majeure_refund', 'orders', orderId, { alasan });

  return refund;
}

// ── List ──────────────────────────────────────────────────────

export async function listRefunds(
  requesterId:   string,
  requesterRole: string,
): Promise<RefundRequest[]> {
  if (requesterRole === 'admin') return repo.findAll();
  return repo.findBySiswa(requesterId);
}
