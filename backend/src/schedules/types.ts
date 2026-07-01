export type ScheduleStatus =
  | 'scheduled'
  | 'berlangsung'
  | 'selesai'
  | 'dibatalkan'
  | 'dijadwalkan_ulang';

export type AttendanceStatus = 'hadir' | 'terlambat' | 'tidak_hadir';

export interface Schedule {
  id:               string;
  program_id:       string;
  tutor_id:         string;
  judul_kelas:      string;
  tanggal:          string;   // YYYY-MM-DD
  jam_mulai:        string;   // HH:mm
  jam_selesai:      string;   // HH:mm
  zoom_meeting_id:  string | null;
  zoom_join_url:    string | null;
  zoom_password:    string | null;
  zoom_start_url?:  string | null; // hanya ada jika role tutor/admin
  status:           ScheduleStatus;
  cancel_reason:    string | null;
  reschedule_from:  string | null;
  created_at:       string;
  updated_at:       string;
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

export interface ScheduleInput {
  program_id:  string;
  judul_kelas: string;
  tanggal:     string;
  jam_mulai:   string;
  jam_selesai: string;
}

export interface CancelInput {
  cancel_reason?: string;
}

export interface RescheduleInput {
  tanggal:     string;
  jam_mulai:   string;
  jam_selesai: string;
}

export interface ScheduleFilters {
  status?:       ScheduleStatus;
  tutor_id?:     string;
  program_id?:   string;
  tanggal_from?: string;
  tanggal_to?:   string;
}
