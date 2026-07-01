import cron from 'node-cron';
import { supabase } from '../supabase.js';

interface ScheduleRow {
  id:           string;
  judul_kelas:  string;
  tanggal:      string;
  jam_mulai:    string;
  zoom_join_url: string | null;
}

export function startNotificationScheduler(): void {
  // Poll setiap menit untuk notifikasi terjadwal
  cron.schedule('* * * * *', () => {
    void checkScheduledNotifications();
  });
  console.log('[Scheduler] Notification scheduler aktif (node-cron, setiap menit)');
}

async function checkScheduledNotifications(): Promise<void> {
  const now  = new Date();
  const hour = now.getHours();
  const currentTime = `${String(hour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // H-1: hari sebelum kelas, kirim antara 08:00–20:00
  if (hour >= 8 && hour < 20) {
    await sendH1Notifications();
  }

  // H-0: hari H, pengingat pagi antara 07:00–09:00
  if (hour >= 7 && hour < 9) {
    await sendH0Notifications();
  }

  // 15-menit sebelum mulai
  await send15MinNotifications(currentTime);
}

async function sendH1Notifications(): Promise<void> {
  const tomorrow = getDateOffset(1);
  const { data, error } = await supabase
    .from('schedules')
    .select('id, judul_kelas, tanggal, jam_mulai')
    .eq('tanggal', tomorrow)
    .eq('notif_h1_sent', false)
    .eq('status', 'scheduled');

  if (error || !data?.length) return;

  for (const s of data as ScheduleRow[]) {
    try {
      // TODO Blok 12: fetch siswa enrolled di s.program_id lalu kirim WhatsApp
      // const siswaList = await getEnrolledSiswa(s.program_id);
      // await Promise.all(siswaList.map(p => sendWhatsApp(p.phone, reminderH1Template(s))));
      console.log(`[Notif H-1] ${s.id} — ${s.judul_kelas} esok ${s.tanggal} ${s.jam_mulai}`);
      await supabase.from('schedules').update({ notif_h1_sent: true }).eq('id', s.id);
    } catch (err) {
      console.error(`[Notif H-1] Error schedule ${s.id}:`, err);
    }
  }
}

async function sendH0Notifications(): Promise<void> {
  const today = getDateOffset(0);
  const { data, error } = await supabase
    .from('schedules')
    .select('id, judul_kelas, tanggal, jam_mulai')
    .eq('tanggal', today)
    .eq('notif_h0_sent', false)
    .eq('status', 'scheduled');

  if (error || !data?.length) return;

  for (const s of data as ScheduleRow[]) {
    try {
      console.log(`[Notif H-0] ${s.id} — ${s.judul_kelas} hari ini ${s.jam_mulai}`);
      await supabase.from('schedules').update({ notif_h0_sent: true }).eq('id', s.id);
    } catch (err) {
      console.error(`[Notif H-0] Error schedule ${s.id}:`, err);
    }
  }
}

async function send15MinNotifications(currentTime: string): Promise<void> {
  const today = getDateOffset(0);
  const { data, error } = await supabase
    .from('schedules')
    .select('id, judul_kelas, tanggal, jam_mulai, zoom_join_url')
    .eq('tanggal', today)
    .eq('notif_15min_sent', false)
    .eq('status', 'scheduled');

  if (error || !data?.length) return;

  const [curH, curM] = currentTime.split(':').map(Number);
  const currentMinutes = curH * 60 + curM;

  for (const s of data as ScheduleRow[]) {
    const [startH, startM] = (s.jam_mulai as string).split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const diffMinutes  = startMinutes - currentMinutes;

    // Kirim jika 1–15 menit sebelum mulai
    if (diffMinutes >= 1 && diffMinutes <= 15) {
      try {
        console.log(`[Notif 15min] ${s.id} — ${s.judul_kelas} mulai ${s.jam_mulai}, link: ${s.zoom_join_url}`);
        await supabase.from('schedules').update({ notif_15min_sent: true }).eq('id', s.id);
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
