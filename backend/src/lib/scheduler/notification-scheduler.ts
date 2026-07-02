import cron from 'node-cron';
import { supabase } from '../supabase.js';
import { getWhatsAppProvider } from '../whatsapp/index.js';

interface ScheduleRow {
  id:            string;
  program_id:    string;
  judul_kelas:   string;
  tanggal:       string;
  jam_mulai:     string;
  zoom_join_url: string | null;
}

interface SiswaProfile {
  siswa_id:        string;
  profiles: { nomor_whatsapp: string | null; nama_lengkap: string };
}

export function startNotificationScheduler(): void {
  cron.schedule('* * * * *', () => {
    void checkScheduledNotifications();
  });
  console.log('[Scheduler] Notification scheduler aktif (node-cron, setiap menit)');
}

async function checkScheduledNotifications(): Promise<void> {
  const now  = new Date();
  const hour = now.getHours();
  const currentTime = `${String(hour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (hour >= 8 && hour < 20) await sendH1Notifications();
  if (hour >= 7 && hour < 9)  await sendH0Notifications();
  await send15MinNotifications(currentTime);
}

async function getEnrolledSiswa(programId: string): Promise<SiswaProfile[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('siswa_id, profiles!siswa_id(nomor_whatsapp, nama_lengkap)')
    .eq('program_id', programId)
    .eq('status', 'active');

  if (error || !data?.length) return [];
  return data as unknown as SiswaProfile[];
}

async function sendToEnrolled(
  schedule:    ScheduleRow,
  buildMsg:    (nama: string) => string,
): Promise<void> {
  const wa       = getWhatsAppProvider();
  const siswaList = await getEnrolledSiswa(schedule.program_id);

  await Promise.allSettled(
    siswaList.map(async (s) => {
      const phone = s.profiles.nomor_whatsapp;
      if (!phone) return;
      const msg = buildMsg(s.profiles.nama_lengkap || 'Siswa');
      const result = await wa.sendMessage(phone, msg);
      if (!result.success) {
        console.warn(`[Notif] Retry 1x → ${phone}`);
        await new Promise((r) => setTimeout(r, 5 * 60_000));
        await wa.sendMessage(phone, msg);
      }
    }),
  );
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
      await sendToEnrolled(s, (nama) =>
        `Halo ${nama}, pengingat kelas *${s.judul_kelas}* akan berlangsung besok, ${s.tanggal} pukul ${s.jam_mulai} WIB.${s.zoom_join_url ? `\nLink Zoom: ${s.zoom_join_url}` : ''}`,
      );
      await supabase.from('schedules').update({ notif_h1_sent: true }).eq('id', s.id);
      console.log(`[Notif H-1] Sent → ${s.id} (${s.judul_kelas})`);
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
      await sendToEnrolled(s, (nama) =>
        `Halo ${nama}, kelas *${s.judul_kelas}* akan berlangsung HARI INI pukul ${s.jam_mulai} WIB.${s.zoom_join_url ? `\nLink Zoom: ${s.zoom_join_url}` : ''}`,
      );
      await supabase.from('schedules').update({ notif_h0_sent: true }).eq('id', s.id);
      console.log(`[Notif H-0] Sent → ${s.id} (${s.judul_kelas})`);
    } catch (err) {
      console.error(`[Notif H-0] Error schedule ${s.id}:`, err);
    }
  }
}

async function send15MinNotifications(currentTime: string): Promise<void> {
  const today = getDateOffset(0);
  const { data, error } = await supabase
    .from('schedules')
    .select('id, program_id, judul_kelas, tanggal, jam_mulai, zoom_join_url')
    .eq('tanggal', today)
    .eq('notif_15min_sent', false)
    .eq('status', 'scheduled');

  if (error || !data?.length) return;

  const [curH, curM] = currentTime.split(':').map(Number);
  const currentMinutes = curH * 60 + curM;

  for (const s of data as ScheduleRow[]) {
    const [startH, startM] = s.jam_mulai.split(':').map(Number);
    const startMinutes     = startH * 60 + startM;
    const diffMinutes      = startMinutes - currentMinutes;

    if (diffMinutes >= 1 && diffMinutes <= 15) {
      try {
        await sendToEnrolled(s, (nama) =>
          `Halo ${nama}, kelas *${s.judul_kelas}* akan dimulai dalam ${diffMinutes} menit!${s.zoom_join_url ? `\nLink Zoom: ${s.zoom_join_url}` : ''}`,
        );
        await supabase.from('schedules').update({ notif_15min_sent: true }).eq('id', s.id);
        console.log(`[Notif 15min] Sent → ${s.id} (${s.judul_kelas})`);
      } catch (err) {
        console.error(`[Notif 15min] Error schedule ${s.id}:`, err);
      }
    }
  }
}

function getDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
