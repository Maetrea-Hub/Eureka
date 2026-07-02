import { api } from './api';

// ── Types ─────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'paid' | 'expired' | 'refunded' | 'cancelled';

export interface Order {
  id:                string;
  siswa_id:          string;
  program_id:        string;
  midtrans_order_id: string;
  snap_token:        string | null;
  nominal:           number;
  status:            OrderStatus;
  payment_date:      string | null;
  expired_at:        string | null;
  order_expires_at:  string;
  created_at:        string;
  updated_at:        string;
  // join from backend
  programs?: { nama: string; tipe_layanan: string; jenjang: string };
}

export type EnrollmentStatus = 'active' | 'expired' | 'cancelled' | 'refunded';

export interface Enrollment {
  id:                  string;
  siswa_id:            string;
  program_id:          string;
  order_id:            string;
  status:              EnrollmentStatus;
  enrolled_at:         string;
  expires_at:          string | null;
  is_first_enrollment: boolean;
  created_at:          string;
  updated_at:          string;
  // join from backend
  programs?: {
    id:             string;
    nama:           string;
    tipe_layanan:   string;
    jenjang:        string;
    mata_pelajaran: string[];
    durasi:         string;
    tarif:          number;
  };
}

export type RefundTipe   = 'standard' | 'force_majeure' | 'trial_session';
export type RefundStatus = 'pending' | 'approved' | 'rejected';

export interface RefundRequest {
  id:             string;
  order_id:       string;
  siswa_id:       string;
  alasan:         string;
  tipe:           RefundTipe;
  status:         RefundStatus;
  diproses_oleh:  string | null;
  diproses_at:    string | null;
  created_at:     string;
  // join from backend
  orders?:        { nominal: number; programs?: { nama: string } };
  siswa?:         { nama_lengkap: string };
}

// ── Labels & Colors ───────────────────────────────────────────

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending:   'Menunggu Pembayaran',
  paid:      'Lunas',
  expired:   'Kedaluwarsa',
  refunded:  'Direfund',
  cancelled: 'Dibatalkan',
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  paid:      'bg-green-100 text-green-800',
  expired:   'bg-gray-100 text-gray-600',
  refunded:  'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-600',
};

export const ENROLLMENT_STATUS_LABEL: Record<EnrollmentStatus, string> = {
  active:    'Aktif',
  expired:   'Kadaluarsa',
  cancelled: 'Dibatalkan',
  refunded:  'Direfund',
};

export const ENROLLMENT_STATUS_COLOR: Record<EnrollmentStatus, string> = {
  active:    'bg-green-100 text-green-800',
  expired:   'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
  refunded:  'bg-blue-100 text-blue-800',
};

export const REFUND_STATUS_LABEL: Record<RefundStatus, string> = {
  pending:  'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};

export const REFUND_TIPE_LABEL: Record<RefundTipe, string> = {
  standard:       'Standar',
  force_majeure:  'Force Majeure',
  trial_session:  'Trial Session',
};

// ── API ───────────────────────────────────────────────────────

export const ordersApi = {
  create: (programId: string) =>
    api.post<Order>('/api/orders', { program_id: programId }).then((r) => r.data),

  list: () =>
    api.get<Order[]>('/api/orders').then((r) => r.data),

  get: (id: string) =>
    api.get<Order>(`/api/orders/${id}`).then((r) => r.data),
};

export const enrollmentsApi = {
  list: () =>
    api.get<Enrollment[]>('/api/enrollments').then((r) => r.data),
};

export const refundsApi = {
  request: (orderId: string, alasan: string) =>
    api.post<RefundRequest>('/api/refunds/request', { order_id: orderId, alasan }).then((r) => r.data),

  list: () =>
    api.get<RefundRequest[]>('/api/refunds').then((r) => r.data),

  process: (id: string, action: 'approved' | 'rejected') =>
    api.patch<RefundRequest>(`/api/refunds/${id}/process`, { action }).then((r) => r.data),

  forceMajeure: (orderId: string, alasan: string) =>
    api.post<RefundRequest>('/api/refunds/force-majeure', { order_id: orderId, alasan }).then((r) => r.data),
};

// ── Utils ─────────────────────────────────────────────────────

export function isWithinRefundWindow(expiredAt: string | null): boolean {
  if (!expiredAt) return false;
  return new Date() <= new Date(expiredAt);
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style:                 'currency',
    currency:              'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}
