import { api } from './api';

export type NotificationKategori =
  | 'pengingat_jadwal_h1' | 'pengingat_jadwal_h0' | 'pengingat_kelas_15menit'
  | 'kelas_dibatalkan'    | 'kelas_dijadwalkan_ulang'
  | 'pembayaran_berhasil' | 'pembayaran_gagal'
  | 'perpanjangan_h7'     | 'perpanjangan_h3'
  | 'refund_diproses'     | 'materi_baru'          | 'rekaman_tersedia'
  | 'verifikasi_email'    | 'password_diubah'
  | 'siswa_baru_daftar'   | 'refund_masuk';

export interface Notification {
  id:         string;
  user_id:    string;
  kategori:   NotificationKategori;
  judul:      string;
  pesan:      string;
  dibaca:     boolean;
  created_at: string;
}

export const KATEGORI_ICON: Record<NotificationKategori, string> = {
  pengingat_jadwal_h1:     '📅',
  pengingat_jadwal_h0:     '📅',
  pengingat_kelas_15menit: '⏰',
  kelas_dibatalkan:        '❌',
  kelas_dijadwalkan_ulang: '🔄',
  pembayaran_berhasil:     '✅',
  pembayaran_gagal:        '⚠️',
  perpanjangan_h7:         '🔔',
  perpanjangan_h3:         '🔔',
  refund_diproses:         '💰',
  materi_baru:             '📚',
  rekaman_tersedia:        '🎬',
  verifikasi_email:        '📧',
  password_diubah:         '🔑',
  siswa_baru_daftar:       '👤',
  refund_masuk:            '💰',
};

export const notificationsApi = {
  getAll: (unread?: boolean) =>
    api.get<Notification[]>(`/api/notifications${unread ? '?unread=true' : ''}`).then((r) => r.data),

  getUnreadCount: () =>
    api.get<{ count: number }>('/api/notifications/unread-count').then((r) => r.data.count),

  markRead: (id: string) =>
    api.patch(`/api/notifications/${id}/read`),

  markAllRead: () =>
    api.patch('/api/notifications/read-all'),
};
