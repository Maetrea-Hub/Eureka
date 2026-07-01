import { api } from './api';

export type ScheduleStatus =
  | 'scheduled'
  | 'berlangsung'
  | 'selesai'
  | 'dibatalkan'
  | 'dijadwalkan_ulang';

export type AttendanceStatus = 'hadir' | 'terlambat' | 'tidak_hadir';

export interface Schedule {
  id:              string;
  program_id:      string;
  tutor_id:        string;
  judul_kelas:     string;
  tanggal:         string;        // YYYY-MM-DD
  jam_mulai:       string;        // HH:mm
  jam_selesai:     string;        // HH:mm
  zoom_meeting_id: string | null;
  zoom_join_url:   string | null;
  zoom_password:   string | null;
  zoom_start_url?: string | null; // hanya untuk tutor/admin
  status:          ScheduleStatus;
  cancel_reason:   string | null;
  reschedule_from: string | null;
  created_at:      string;
  updated_at:      string;
}

export interface Attendance {
  id:                    string;
  schedule_id:           string;
  siswa_id:              string;
  join_time:             string | null;
  status:                AttendanceStatus;
  late_tolerance_minutes: number;
  created_at:            string;
}

export type ScheduleInput = {
  program_id:  string;
  judul_kelas: string;
  tanggal:     string;
  jam_mulai:   string;
  jam_selesai: string;
};

export interface ScheduleFilters {
  status?:       ScheduleStatus;
  tutor_id?:     string;
  program_id?:   string;
  tanggal_from?: string;
  tanggal_to?:   string;
}

export const STATUS_LABEL: Record<ScheduleStatus, string> = {
  scheduled:         'Terjadwal',
  berlangsung:       'Berlangsung',
  selesai:           'Selesai',
  dibatalkan:        'Dibatalkan',
  dijadwalkan_ulang: 'Dijadwalkan Ulang',
};

export const STATUS_COLOR: Record<ScheduleStatus, string> = {
  scheduled:         'bg-blue-100 text-blue-700',
  berlangsung:       'bg-green-100 text-green-700',
  selesai:           'bg-gray-100 text-gray-600',
  dibatalkan:        'bg-red-100 text-red-700',
  dijadwalkan_ulang: 'bg-orange-100 text-orange-700',
};

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  hadir:       'Hadir',
  terlambat:   'Terlambat',
  tidak_hadir: 'Tidak Hadir',
};

export const ATTENDANCE_COLOR: Record<AttendanceStatus, string> = {
  hadir:       'bg-green-100 text-green-700',
  terlambat:   'bg-yellow-100 text-yellow-700',
  tidak_hadir: 'bg-red-100 text-red-700',
};

export const schedulesApi = {
  getAll: (filters?: ScheduleFilters) => {
    const p = new URLSearchParams();
    if (filters?.status)       p.set('status',       filters.status);
    if (filters?.tutor_id)     p.set('tutor_id',     filters.tutor_id);
    if (filters?.program_id)   p.set('program_id',   filters.program_id);
    if (filters?.tanggal_from) p.set('tanggal_from', filters.tanggal_from);
    if (filters?.tanggal_to)   p.set('tanggal_to',   filters.tanggal_to);
    return api.get<Schedule[]>(`/api/schedules?${p}`).then((r) => r.data);
  },

  getById: (id: string) =>
    api.get<Schedule>(`/api/schedules/${id}`).then((r) => r.data),

  join: (id: string) =>
    api.get<{ join_url: string; attendance: Attendance }>(`/api/schedules/${id}/join`)
      .then((r) => r.data),

  create: (input: ScheduleInput) =>
    api.post<Schedule>('/api/schedules', input).then((r) => r.data),

  update: (id: string, input: Partial<ScheduleInput>) =>
    api.put<Schedule>(`/api/schedules/${id}`, input).then((r) => r.data),

  cancel: (id: string, cancel_reason?: string) =>
    api.patch<Schedule>(`/api/schedules/${id}/cancel`, { cancel_reason }).then((r) => r.data),

  reschedule: (id: string, input: Pick<ScheduleInput, 'tanggal' | 'jam_mulai' | 'jam_selesai'>) =>
    api.patch<Schedule>(`/api/schedules/${id}/reschedule`, input).then((r) => r.data),

  end: (id: string) =>
    api.patch<Schedule>(`/api/schedules/${id}/end`).then((r) => r.data),

  getAttendances: (id: string) =>
    api.get<Attendance[]>(`/api/schedules/${id}/attendances`).then((r) => r.data),
};
