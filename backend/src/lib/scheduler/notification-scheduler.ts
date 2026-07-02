import cron from 'node-cron';
import { supabase } from '../supabase.js';
import * as notifService from '../../notifications/service.js';
import type { NotifRecipient } from '../../notifications/types.js';

interface ScheduleRow {
  id:            string;
  program_id:    string;
  judul_kelas:   string;
  tanggal:       string;
  jam_mulai:     string;
  zoom_join_url: string | null;
}

interface EnrolledRow {
  siswa_id: string;
  profiles: NotifRecipient;
}

export function startNotificationScheduler(): void {
  // Jadwal kelas: H-1 (jam 8-20), H-0 (jam 7-9), 15min (setiap menit)
  cron.schedule('* * * * *', () => { void checkScheduleNotifications(); });

  // Perpanjangan program: cek enrollment yang akan expire dalam 7 atau 3 hari
  cron.schedule('0 9 * * *', () => { void checkPerpanjanganNotifications(); });

  console.log('[Scheduler] Notification scheduler aktif (node-cron)');
}

// ── Helpers ───────────────────────────────────────────────────

function getDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function getEnrolledSiswa(programId: string): Promise<NotifRecipient[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('siswa_id, profiles!siswa_id(id, nomor_whatsapp, nama_lengkap)')
    .eq('program_id', programId)
    .eq('status', 'active');

  if (error || !data?.length) return [];
  return (data as unknown as EnrolledRow[]).map((r) => r.profiles);
}

// ── Minute cron: H-1, H-0, 15min ─────────────────────────────

async function checkScheduleNotifications(): Promise<void> {
  const hour = new Date().getHours();
  if (hour >= 8 && hour < 20) await sendH1Notifications();
  if (hour >= 7 && hour < 9)  await sendH0Notifications();
  await send15MinNotifications();
}

async function sendH1Notifications(): Promise<void> {
  const tomorrow = getDateOffset(1);
  const { data, error } = await supabase
    .from('schedules')
    .select('id, program_id, judul_kelas, tanggal, jam_mulai, zoom_join_url')
    .eq('tanggal', tomorrow)
    .eq('notif_h1_sent', false)
    .eq('status', 'scheduled');

  if (error || !data?.length) return;

  for (const s of data as ScheduleRow[]) {
    try {
      const siswa = await getEnrolledSiswa(s.program_id);
      await notifService.dispatchToMany(siswa, 'pengingat_jadwal_h1', (nama) => ({
        nama_siswa:  nama,
        judul_kelas: s.judul_kelas,
        tanggal:     s.tanggal,
        jam_mulai:   s.jam_mulai,
        link_zoom:   s.zoom_join_url ?? undefined,
      }));
      await supabase.from('schedules').update({ notif_h1_sent: true }).eq('id', s.id);
      console.log(`[Notif H-1] Sent → ${s.id}`);
    } catch (err) {
      console.error(`[Notif H-1] Error schedule ${s.id}:`, err);
    }
  }
}

async function sendH0Notifications(): Promise<void> {
  const today = getDateOffset(0);
  const { data, error } = await supabase
    .from('schedules')
    .select('id, program_id, judul_kelas, tanggal, jam_mulai, zoom_join_url')
    .eq('tanggal', today)
    .eq('notif_h0_sent', false)
    .eq('status', 'scheduled');

  if (error || !data?.length) return;

  for (const s of data as ScheduleRow[]) {
    try {
      const siswa = await getEnrolledSiswa(s.program_id);
      await notifService.dispatchToMany(siswa, 'pengingat_jadwal_h0', (nama) => ({
        nama_siswa:  nama,
        judul_kelas: s.judul_kelas,
        tanggal:     s.tanggal,
        jam_mulai:   s.jam_mulai,
        link_zoom:   s.zoom_join_url ?? undefined,
      }));
      await supabase.from('schedules').update({ notif_h0_sent: true }).eq('id', s.id);
      console.log(`[Notif H-0] Sent → ${s.id}`);
    } catch (err) {
      console.error(`[Notif H-0] Error schedule ${s.id}:`, err);
    }
  }
}

async function send15MinNotifications(): Promise<void> {
  const today = getDateOffset(0);
  const now   = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const { data, error } = await supabase
    .from('schedules')
    .select('id, program_id, judul_kelas, tanggal, jam_mulai, zoom_join_url')
    .eq('tanggal', today)
    .eq('notif_15min_sent', false)
    .eq('status', 'scheduled');

  if (error || !data?.length) return;

  for (const s of data as ScheduleRow[]) {
    const [startH, startM] = s.jam_mulai.split(':').map(Number);
    const diffMinutes      = (startH * 60 + startM) - currentMinutes;

    if (diffMinutes >= 1 && diffMinutes <= 15) {
      try {
        const siswa = await getEnrolledSiswa(s.program_id);
        await notifService.dispatchToMany(siswa, 'pengingat_kelas_15menit', (nama) => ({
          nama_siswa:  nama,
          judul_kelas: s.judul_kelas,
          link_zoom:   s.zoom_join_url ?? undefined,
        }));
        await supabase.from('schedules').update({ notif_15min_sent: true }).eq('id', s.id);
        console.log(`[Notif 15min] Sent → ${s.id}`);
      } catch (err) {
        console.error(`[Notif 15min] Error schedule ${s.id}:`, err);
      }
    }
  }
}

// ── Daily cron 09:00: perpanjangan H-7 dan H-3 ───────────────

async function checkPerpanjanganNotifications(): Promise<void> {
  await sendPerpanjanganForDays(7, 'perpanjangan_h7');
  await sendPerpanjanganForDays(3, 'perpanjangan_h3');
}

async function sendPerpanjanganForDays(
  days:     number,
  kategori: 'perpanjangan_h7' | 'perpanjangan_h3',
): Promise<void> {
  const dateFrom = `${getDateOffset(days)}T00:00:00+00:00`;
  const dateTo   = `${getDateOffset(days + 1)}T00:00:00+00:00`;

  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      siswa_id,
      expires_at,
      programs!program_id(nama),
      profiles!siswa_id(id, nomor_whatsapp, nama_lengkap)
    `)
    .eq('status', 'active')
    .gte('expires_at', dateFrom)
    .lt('expires_at', dateTo);

  if (error || !data?.length) return;

  for (const row of data as unknown as Array<{
    siswa_id: string;
    expires_at: string;
    programs: { nama: string };
    profiles: NotifRecipient;
  }>) {
    try {
      const recipient = row.profiles;
      await notifService.dispatch(
        recipient.id,
        recipient.nomor_whatsapp,
        kategori,
        {
          nama_siswa:   recipient.nama_lengkap || 'Siswa',
          nama_program: row.programs.nama,
          sisa_hari:    days,
        },
      );
    } catch (err) {
      console.error(`[Notif Perpanjangan H-${days}] Error siswa ${row.siswa_id}:`, err);
    }
  }

  console.log(`[Notif Perpanjangan H-${days}] Selesai — ${data.length} enrollment`);
}
