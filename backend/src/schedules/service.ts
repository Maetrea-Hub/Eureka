import * as repo from './repository.js';
import { createZoomMeeting, updateZoomMeeting, deleteZoomMeeting } from '../lib/zoom/zoom-client.js';
import type { Schedule, Attendance, ScheduleInput, CancelInput, RescheduleInput, ScheduleFilters } from './types.js';

// ── Helpers ───────────────────────────────────────────────────

function toZoomStartTime(tanggal: string, jamMulai: string): string {
  // WIB = UTC+7; Zoom API expects UTC ISO 8601
  return new Date(`${tanggal}T${jamMulai}:00+07:00`).toISOString();
}

function calcDuration(jamMulai: string, jamSelesai: string): number {
  const [sh, sm] = jamMulai.split(':').map(Number);
  const [eh, em] = jamSelesai.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

function assertOwner(schedule: Schedule, requesterId: string, requesterRole: string): void {
  if (requesterRole !== 'admin' && schedule.tutor_id !== requesterId) {
    throw new Error('tidak berhak mengubah jadwal milik tutor lain');
  }
}

function assertEditable(schedule: Schedule): void {
  if (schedule.status === 'dibatalkan') throw new Error('jadwal sudah dibatalkan');
  if (schedule.status === 'selesai')    throw new Error('tidak bisa mengubah jadwal yang sudah selesai');
}

// ── Schedules ─────────────────────────────────────────────────

export async function listSchedules(
  filters: ScheduleFilters,
  requesterId: string,
  requesterRole: string,
): Promise<Schedule[]> {
  // Tutor difilter ke jadwal sendiri kecuali filter tutor_id eksplisit disuplai
  if (requesterRole === 'tutor' && !filters.tutor_id) {
    filters = { ...filters, tutor_id: requesterId };
  }
  return repo.findAll(filters);
}

export async function getSchedule(
  id: string,
  requesterId: string,
  requesterRole: string,
): Promise<Schedule> {
  const schedule = await repo.findById(id);
  if (!schedule) throw new Error('tidak ditemukan');

  if (requesterRole === 'tutor' || requesterRole === 'admin') {
    const startUrl = await repo.getHostUrl(id);
    return { ...schedule, zoom_start_url: startUrl };
  }
  return schedule;
}

export async function createSchedule(
  input: ScheduleInput,
  tutorId: string,
): Promise<Schedule> {
  const zoomData = await createZoomMeeting({
    topic:           input.judul_kelas,
    startTime:       toZoomStartTime(input.tanggal, input.jam_mulai),
    durationMinutes: calcDuration(input.jam_mulai, input.jam_selesai),
  });
  return repo.create(input, tutorId, zoomData);
}

export async function editSchedule(
  id: string,
  input: Partial<ScheduleInput>,
  requesterId: string,
  requesterRole: string,
): Promise<Schedule> {
  const existing = await repo.findById(id);
  if (!existing) throw new Error('tidak ditemukan');
  assertOwner(existing, requesterId, requesterRole);
  assertEditable(existing);

  const updates: Parameters<typeof repo.update>[1] = {};
  if (input.judul_kelas) updates.judul_kelas = input.judul_kelas;
  if (input.tanggal)     updates.tanggal     = input.tanggal;
  if (input.jam_mulai)   updates.jam_mulai   = input.jam_mulai;
  if (input.jam_selesai) updates.jam_selesai = input.jam_selesai;

  const timeChanged = input.tanggal || input.jam_mulai || input.jam_selesai;
  if (timeChanged && existing.zoom_meeting_id) {
    const tanggal    = input.tanggal    ?? existing.tanggal;
    const jamMulai   = input.jam_mulai  ?? existing.jam_mulai;
    const jamSelesai = input.jam_selesai ?? existing.jam_selesai;

    await updateZoomMeeting(existing.zoom_meeting_id, {
      topic:           input.judul_kelas ?? existing.judul_kelas,
      startTime:       toZoomStartTime(tanggal, jamMulai),
      durationMinutes: calcDuration(jamMulai, jamSelesai),
    });
    // Reset notif flags agar terkirim ulang pada waktu baru
    updates.notif_h1_sent    = false;
    updates.notif_h0_sent    = false;
    updates.notif_15min_sent = false;
  }

  return repo.update(id, updates);
}

export async function cancelSchedule(
  id: string,
  input: CancelInput,
  requesterId: string,
  requesterRole: string,
): Promise<Schedule> {
  const existing = await repo.findById(id);
  if (!existing) throw new Error('tidak ditemukan');
  assertOwner(existing, requesterId, requesterRole);
  if (existing.status === 'dibatalkan') throw new Error('jadwal sudah dibatalkan');
  if (existing.status === 'selesai')    throw new Error('tidak bisa cancel jadwal yang sudah selesai');

  if (existing.zoom_meeting_id) {
    try { await deleteZoomMeeting(existing.zoom_meeting_id); } catch { /* sudah terhapus */ }
  }

  // TODO Blok 12: kirim notif cancel ke semua siswa enrolled
  // const enrolled = await getEnrolledSiswa(existing.program_id);
  // await Promise.all(enrolled.map(p => sendWhatsApp(p.phone, cancelTemplate(existing, input.cancel_reason))));
  console.log(`[Cancel] Schedule ${id} — alasan: ${input.cancel_reason ?? '—'}`);

  return repo.update(id, { status: 'dibatalkan', cancel_reason: input.cancel_reason ?? null });
}

export async function rescheduleSchedule(
  id: string,
  input: RescheduleInput,
  requesterId: string,
  requesterRole: string,
): Promise<Schedule> {
  const existing = await repo.findById(id);
  if (!existing) throw new Error('tidak ditemukan');
  assertOwner(existing, requesterId, requesterRole);
  assertEditable(existing);

  // Tandai jadwal lama sebagai dijadwalkan_ulang
  await repo.update(id, { status: 'dijadwalkan_ulang' });

  // Hapus Zoom meeting lama
  if (existing.zoom_meeting_id) {
    try { await deleteZoomMeeting(existing.zoom_meeting_id); } catch { /* ignore */ }
  }

  // Buat jadwal baru dengan Zoom meeting baru
  const newInput: ScheduleInput = {
    program_id:  existing.program_id,
    judul_kelas: existing.judul_kelas,
    tanggal:     input.tanggal,
    jam_mulai:   input.jam_mulai,
    jam_selesai: input.jam_selesai,
  };
  const zoomData = await createZoomMeeting({
    topic:           existing.judul_kelas,
    startTime:       toZoomStartTime(input.tanggal, input.jam_mulai),
    durationMinutes: calcDuration(input.jam_mulai, input.jam_selesai),
  });

  const newSchedule = await repo.create(newInput, existing.tutor_id, zoomData);
  await repo.update(newSchedule.id, { reschedule_from: id });

  // TODO Blok 12: kirim notif reschedule ke semua siswa enrolled
  console.log(`[Reschedule] Schedule ${id} → baru ${newSchedule.id}`);

  return newSchedule;
}

export async function endSchedule(
  id: string,
  requesterId: string,
  requesterRole: string,
): Promise<Schedule> {
  const existing = await repo.findById(id);
  if (!existing) throw new Error('tidak ditemukan');
  assertOwner(existing, requesterId, requesterRole);
  if (existing.status === 'selesai') throw new Error('jadwal sudah selesai');

  // Batch-set siswa yang tidak join menjadi tidak_hadir
  await repo.batchMarkNotHadir(id);
  return repo.update(id, { status: 'selesai' });
}

// ── Attendance ────────────────────────────────────────────────

export async function joinClass(
  scheduleId: string,
  siswaId: string,
): Promise<{ join_url: string; attendance: Attendance }> {
  const schedule = await repo.findById(scheduleId);
  if (!schedule) throw new Error('tidak ditemukan');
  if (schedule.status !== 'scheduled' && schedule.status !== 'berlangsung') {
    throw new Error('kelas tidak aktif atau belum dijadwalkan');
  }
  if (!schedule.zoom_join_url) throw new Error('link zoom belum tersedia');

  // TODO Blok 12: cek enrollment siswa di program ini
  // const enrolled = await checkEnrollment(siswaId, schedule.program_id);
  // if (!enrolled) throw new Error('tidak terdaftar di program ini');

  const toleranceStr = await repo.getSetting('late_tolerance_minutes');
  const tolerance    = parseInt(toleranceStr ?? '15', 10);

  const now       = new Date();
  const joinTime  = now.toISOString();

  // Bandingkan waktu join dengan jam_mulai (assume WIB/UTC+7)
  const scheduleStart = new Date(`${schedule.tanggal}T${schedule.jam_mulai}:00+07:00`);
  const diffMinutes   = (now.getTime() - scheduleStart.getTime()) / 60_000;

  const status: 'hadir' | 'terlambat' = diffMinutes <= tolerance ? 'hadir' : 'terlambat';

  const attendance = await repo.upsertAttendance(scheduleId, siswaId, joinTime, status, tolerance);
  return { join_url: schedule.zoom_join_url, attendance };
}

export async function getAttendances(
  scheduleId: string,
  requesterId: string,
  requesterRole: string,
): Promise<Attendance[]> {
  const schedule = await repo.findById(scheduleId);
  if (!schedule) throw new Error('tidak ditemukan');
  if (requesterRole === 'tutor' && schedule.tutor_id !== requesterId) {
    throw new Error('tidak berhak melihat absensi jadwal ini');
  }
  return repo.findAttendancesBySchedule(scheduleId);
}
