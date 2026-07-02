import type { NotificationKategori, NotificationVars } from './types.js';

export function buildTemplate(
  kategori: NotificationKategori,
  vars: NotificationVars,
): { judul: string; pesan: string } {
  const nama = vars.nama_siswa ?? 'Siswa';

  switch (kategori) {
    case 'pengingat_jadwal_h1':
      return {
        judul: 'Pengingat Kelas Besok',
        pesan:
          `Halo ${nama}, pengingat kelas *${vars.judul_kelas}* akan berlangsung besok, ` +
          `${vars.tanggal} pukul ${vars.jam_mulai} WIB.` +
          (vars.link_zoom ? `\nLink Zoom: ${vars.link_zoom}` : ''),
      };

    case 'pengingat_jadwal_h0':
      return {
        judul: 'Kelas Hari Ini',
        pesan:
          `Halo ${nama}, kelas *${vars.judul_kelas}* berlangsung HARI INI pukul ${vars.jam_mulai} WIB.` +
          (vars.link_zoom ? `\nLink Zoom: ${vars.link_zoom}` : ''),
      };

    case 'pengingat_kelas_15menit':
      return {
        judul: 'Kelas Segera Dimulai',
        pesan:
          `Halo ${nama}, kelas *${vars.judul_kelas}* akan dimulai dalam 15 menit!` +
          (vars.link_zoom ? `\nLink Zoom: ${vars.link_zoom}` : ''),
      };

    case 'kelas_dibatalkan':
      return {
        judul: 'Kelas Dibatalkan',
        pesan:
          `Halo ${nama}, kelas *${vars.judul_kelas}* pada ${vars.tanggal} pukul ${vars.jam_mulai} WIB telah dibatalkan.` +
          (vars.cancel_reason ? `\nAlasan: ${vars.cancel_reason}` : '') +
          '\nMaaf atas ketidaknyamanannya.',
      };

    case 'kelas_dijadwalkan_ulang':
      return {
        judul: 'Kelas Dijadwalkan Ulang',
        pesan:
          `Halo ${nama}, kelas *${vars.judul_kelas}* telah dijadwalkan ulang ke ${vars.tanggal} pukul ${vars.jam_mulai} WIB.` +
          (vars.link_zoom ? `\nLink Zoom baru: ${vars.link_zoom}` : ''),
      };

    case 'pembayaran_berhasil':
      return {
        judul: 'Pembayaran Berhasil',
        pesan:
          `Halo ${nama}, pembayaran untuk program *${vars.nama_program}* telah berhasil dikonfirmasi. ` +
          'Akses materi dan jadwal kelas Anda sudah aktif.',
      };

    case 'pembayaran_gagal':
      return {
        judul: 'Pembayaran Gagal / Expired',
        pesan:
          `Halo ${nama}, pembayaran untuk program *${vars.nama_program}* tidak berhasil atau sudah kedaluwarsa. ` +
          'Silakan buat order baru jika ingin mendaftar ulang.',
      };

    case 'perpanjangan_h7':
      return {
        judul: 'Program Akan Berakhir dalam 7 Hari',
        pesan:
          `Halo ${nama}, program *${vars.nama_program}* Anda akan berakhir dalam 7 hari. ` +
          'Perpanjang sekarang agar akses materi dan jadwal kelas tidak terputus.',
      };

    case 'perpanjangan_h3':
      return {
        judul: 'Program Akan Berakhir dalam 3 Hari',
        pesan:
          `Halo ${nama}, program *${vars.nama_program}* Anda akan berakhir dalam 3 hari. ` +
          'Segera perpanjang untuk menjaga kontinuitas belajar Anda.',
      };

    case 'refund_diproses':
      return {
        judul: `Refund ${vars.status_refund === 'approved' ? 'Disetujui' : 'Ditolak'}`,
        pesan:
          `Halo ${nama}, pengajuan refund Anda untuk program *${vars.nama_program}* telah ` +
          (vars.status_refund === 'approved'
            ? 'disetujui. Dana akan dikembalikan dalam 3-7 hari kerja.'
            : `ditolak.${vars.alasan ? ` Alasan: ${vars.alasan}` : ''}`),
      };

    case 'materi_baru':
      return {
        judul: 'Materi Baru Tersedia',
        pesan:
          `Halo ${nama}, materi baru *${vars.nama_materi}* telah dipublish. ` +
          'Akses sekarang di halaman Materi.',
      };

    case 'rekaman_tersedia':
      return {
        judul: 'Rekaman Kelas Tersedia',
        pesan:
          `Halo ${nama}, rekaman kelas *${vars.judul_kelas}* sudah tersedia.` +
          (vars.recording_url ? `\nTonton: ${vars.recording_url}` : ''),
      };

    case 'verifikasi_email':
      return {
        judul: 'Verifikasi Email Anda',
        pesan:
          `Halo ${nama}, terima kasih telah mendaftar di Eureka Bimbel! ` +
          `Kami telah mengirimkan email verifikasi ke ${vars.email ?? 'email Anda'}. ` +
          'Silakan cek email dan klik link verifikasi untuk mengaktifkan akun.',
      };

    case 'password_diubah':
      return {
        judul: 'Password Berhasil Diubah',
        pesan:
          `Halo ${nama}, password akun Eureka Bimbel Anda telah berhasil diubah. ` +
          'Jika Anda tidak melakukan perubahan ini, segera hubungi admin.',
      };

    case 'siswa_baru_daftar':
      return {
        judul: 'Siswa Baru Mendaftar Program',
        pesan:
          `Siswa *${vars.nama_siswa}* baru saja mendaftar program *${vars.nama_program}*. ` +
          'Cek dashboard untuk detailnya.',
      };

    case 'refund_masuk':
      return {
        judul: 'Pengajuan Refund Masuk',
        pesan:
          `Siswa *${vars.nama_siswa}* mengajukan refund untuk program *${vars.nama_program}*. ` +
          (vars.alasan ? `Alasan: ${vars.alasan}` : '') +
          ' Segera proses di halaman Refund Requests.',
      };
  }
}
