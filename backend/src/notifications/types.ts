export type NotificationKategori =
  | 'pengingat_jadwal_h1'
  | 'pengingat_jadwal_h0'
  | 'pengingat_kelas_15menit'
  | 'kelas_dibatalkan'
  | 'kelas_dijadwalkan_ulang'
  | 'pembayaran_berhasil'
  | 'pembayaran_gagal'
  | 'perpanjangan_h7'
  | 'perpanjangan_h3'
  | 'refund_diproses'
  | 'materi_baru'
  | 'rekaman_tersedia'
  | 'verifikasi_email'
  | 'password_diubah'
  | 'siswa_baru_daftar'
  | 'refund_masuk';

export interface Notification {
  id:         string;
  user_id:    string;
  kategori:   NotificationKategori;
  judul:      string;
  pesan:      string;
  dibaca:     boolean;
  created_at: string;
}

export interface NotificationVars {
  nama_siswa?:     string;
  nama_admin?:     string;
  mata_pelajaran?: string;
  judul_kelas?:    string;
  tanggal?:        string;
  jam_mulai?:      string;
  link_zoom?:      string;
  nama_program?:   string;
  sisa_hari?:      number;
  recording_url?:  string;
  alasan?:         string;
  status_refund?:  string;
  nama_materi?:    string;
  email?:          string;
  cancel_reason?:  string;
}

export interface NotifRecipient {
  id:              string;
  nomor_whatsapp:  string | null;
  nama_lengkap:    string;
}
