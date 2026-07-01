import { supabase } from '../lib/supabase.js';
import type { Schedule, Attendance, ScheduleInput, ScheduleFilters, ScheduleStatus } from './types.js';

// ── Schedules ─────────────────────────────────────────────────

export async function findAll(filters: ScheduleFilters = {}): Promise<Schedule[]> {
  let q = supabase
    .from('schedules')
    .select('*')
    .order('tanggal')
    .order('jam_mulai');

  if (filters.status)       q = q.eq('status', filters.status);
  if (filters.tutor_id)     q = q.eq('tutor_id', filters.tutor_id);
  if (filters.program_id)   q = q.eq('program_id', filters.program_id);
  if (filters.tanggal_from) q = q.gte('tanggal', filters.tanggal_from);
  if (filters.tanggal_to)   q = q.lte('tanggal', filters.tanggal_to);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Schedule[];
}

export async function findById(id: string): Promise<Schedule | null> {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('id', id)
    .single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error(error.message);
  return data as Schedule;
}

export async function getHostUrl(scheduleId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('schedule_host_urls')
    .select('zoom_start_url')
    .eq('schedule_id', scheduleId)
    .single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error(error.message);
  return (data as { zoom_start_url: string }).zoom_start_url;
}

export async function create(
  input: ScheduleInput,
  tutorId: string,
  zoomData: { meetingId: string; joinUrl: string; startUrl: string; password: string },
): Promise<Schedule> {
  const { data, error } = await supabase
    .from('schedules')
    .insert({
      program_id:      input.program_id,
      tutor_id:        tutorId,
      judul_kelas:     input.judul_kelas,
      tanggal:         input.tanggal,
      jam_mulai:       input.jam_mulai,
      jam_selesai:     input.jam_selesai,
      zoom_meeting_id: zoomData.meetingId,
      zoom_join_url:   zoomData.joinUrl,
      zoom_password:   zoomData.password,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  // start_url disimpan di tabel sensitif terpisah
  await supabase
    .from('schedule_host_urls')
    .insert({ schedule_id: (data as Schedule).id, zoom_start_url: zoomData.startUrl });

  return data as Schedule;
}

export async function update(
  id: string,
  fields: Partial<{
    judul_kelas:     string;
    tanggal:         string;
    jam_mulai:       string;
    jam_selesai:     string;
    zoom_meeting_id: string;
    zoom_join_url:   string;
    zoom_password:   string;
    status:          ScheduleStatus;
    cancel_reason:   string | null;
    reschedule_from: string;
    notif_h1_sent:   boolean;
    notif_h0_sent:   boolean;
    notif_15min_sent: boolean;
  }>,
): Promise<Schedule> {
  const { data, error } = await supabase
    .from('schedules')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Schedule;
}

export async function updateHostUrl(scheduleId: string, zoomStartUrl: string): Promise<void> {
  const { error } = await supabase
    .from('schedule_host_urls')
    .upsert({ schedule_id: scheduleId, zoom_start_url: zoomStartUrl });
  if (error) throw new Error(error.message);
}

// ── Attendances ───────────────────────────────────────────────

export async function findAttendancesBySchedule(scheduleId: string): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from('attendances')
    .select('*')
    .eq('schedule_id', scheduleId)
    .order('created_at');
  if (error) throw new Error(error.message);
  return (data ?? []) as Attendance[];
}

export async function findAttendanceBySiswa(
  scheduleId: string,
  siswaId: string,
): Promise<Attendance | null> {
  const { data, error } = await supabase
    .from('attendances')
    .select('*')
    .eq('schedule_id', scheduleId)
    .eq('siswa_id', siswaId)
    .single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error(error.message);
  return data as Attendance;
}

export async function upsertAttendance(
  scheduleId: string,
  siswaId: string,
  joinTime: string,
  status: 'hadir' | 'terlambat',
  toleranceMinutes: number,
): Promise<Attendance> {
  const { data, error } = await supabase
    .from('attendances')
    .upsert(
      {
        schedule_id:           scheduleId,
        siswa_id:              siswaId,
        join_time:             joinTime,
        status,
        late_tolerance_minutes: toleranceMinutes,
      },
      { onConflict: 'schedule_id,siswa_id' },
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Attendance;
}

export async function batchMarkNotHadir(scheduleId: string): Promise<void> {
  const { error } = await supabase
    .from('attendances')
    .update({ status: 'tidak_hadir' })
    .eq('schedule_id', scheduleId)
    .is('join_time', null);
  if (error) throw new Error(error.message);
}

// ── Settings ──────────────────────────────────────────────────

export async function getSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error(error.message);
  return (data as { value: string }).value;
}
