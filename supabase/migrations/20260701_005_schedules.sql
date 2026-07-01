-- ─────────────────────────────────────────────────────────────
-- Migration 005 — Live Kelas (Zoom)
-- Tabel: settings, schedules, schedule_host_urls, attendances
-- zoom_start_url dipisah ke schedule_host_urls — siswa NO ACCESS
-- ─────────────────────────────────────────────────────────────

-- ── ENUM types ────────────────────────────────────────────────
CREATE TYPE public.schedule_status AS ENUM (
    'scheduled', 'berlangsung', 'selesai', 'dibatalkan', 'dijadwalkan_ulang'
);
CREATE TYPE public.attendance_status AS ENUM ('hadir', 'terlambat', 'tidak_hadir');

-- ── Table: settings ───────────────────────────────────────────
CREATE TABLE public.settings (
    key        TEXT        PRIMARY KEY,
    value      TEXT        NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.settings (key, value) VALUES ('late_tolerance_minutes', '15');

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_authenticated_read" ON public.settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "settings_admin_update" ON public.settings
    FOR UPDATE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ── Table: schedules ──────────────────────────────────────────
-- zoom_start_url TIDAK ADA di sini — disimpan di schedule_host_urls
CREATE TABLE public.schedules (
    id                 UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id         UUID                    NOT NULL
        REFERENCES public.programs(id) ON DELETE RESTRICT,
    tutor_id           UUID                    NOT NULL
        REFERENCES public.profiles(id) ON DELETE RESTRICT,
    judul_kelas        TEXT                    NOT NULL,
    tanggal            DATE                    NOT NULL,
    jam_mulai          TIME                    NOT NULL,
    jam_selesai        TIME                    NOT NULL,
    zoom_meeting_id    TEXT,
    zoom_join_url      TEXT,
    zoom_password      TEXT,
    status             public.schedule_status  NOT NULL DEFAULT 'scheduled',
    cancel_reason      TEXT,
    reschedule_from    UUID
        REFERENCES public.schedules(id) ON DELETE SET NULL,
    -- Tracking notifikasi node-cron (polling setiap menit)
    notif_h1_sent      BOOLEAN                 NOT NULL DEFAULT FALSE,
    notif_h0_sent      BOOLEAN                 NOT NULL DEFAULT FALSE,
    notif_15min_sent   BOOLEAN                 NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

CREATE INDEX schedules_tutor_id_idx     ON public.schedules(tutor_id);
CREATE INDEX schedules_program_id_idx   ON public.schedules(program_id);
CREATE INDEX schedules_tanggal_idx      ON public.schedules(tanggal);
CREATE INDEX schedules_status_idx       ON public.schedules(status);

CREATE TRIGGER schedules_updated_at
    BEFORE UPDATE ON public.schedules
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Admin: akses penuh
CREATE POLICY "schedules_admin_all" ON public.schedules
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Tutor: SELECT semua jadwal (untuk koordinasi)
CREATE POLICY "schedules_tutor_select" ON public.schedules
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'tutor')
    );

-- Tutor: INSERT jadwal milik sendiri
CREATE POLICY "schedules_tutor_insert" ON public.schedules
    FOR INSERT TO authenticated
    WITH CHECK (
        tutor_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'tutor')
    );

-- Tutor: UPDATE jadwal milik sendiri
CREATE POLICY "schedules_tutor_update_own" ON public.schedules
    FOR UPDATE TO authenticated
    USING (
        tutor_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'tutor')
    )
    WITH CHECK (
        tutor_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'tutor')
    );

-- Tutor: DELETE jadwal milik sendiri
CREATE POLICY "schedules_tutor_delete_own" ON public.schedules
    FOR DELETE TO authenticated
    USING (
        tutor_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'tutor')
    );

-- Siswa: READ jadwal non-cancelled (status != 'dibatalkan')
-- TODO Blok 12: perketat dengan filter program enrollment
CREATE POLICY "schedules_siswa_read" ON public.schedules
    FOR SELECT TO authenticated
    USING (
        status != 'dibatalkan'
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'siswa')
    );

-- ── Table: schedule_host_urls (SENSITIF) ──────────────────────
-- Hanya tutor yang mengampu + admin yang bisa baca
-- Siswa TIDAK ADA policy di sini → denied by default
CREATE TABLE public.schedule_host_urls (
    schedule_id    UUID PRIMARY KEY
        REFERENCES public.schedules(id) ON DELETE CASCADE,
    zoom_start_url TEXT NOT NULL
);

ALTER TABLE public.schedule_host_urls ENABLE ROW LEVEL SECURITY;

-- Admin: akses penuh
CREATE POLICY "host_urls_admin_all" ON public.schedule_host_urls
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Tutor: SELECT start_url untuk jadwal yang diampu sendiri
CREATE POLICY "host_urls_tutor_own" ON public.schedule_host_urls
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.schedules s
            WHERE s.id = schedule_id AND s.tutor_id = auth.uid()
        )
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'tutor')
    );

-- ── Table: attendances ────────────────────────────────────────
CREATE TABLE public.attendances (
    id                     UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id            UUID                      NOT NULL
        REFERENCES public.schedules(id) ON DELETE CASCADE,
    siswa_id               UUID                      NOT NULL
        REFERENCES public.profiles(id) ON DELETE RESTRICT,
    join_time              TIMESTAMPTZ,
    status                 public.attendance_status  NOT NULL DEFAULT 'tidak_hadir',
    late_tolerance_minutes INTEGER                   NOT NULL DEFAULT 15,
    created_at             TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
    UNIQUE(schedule_id, siswa_id)
);

CREATE INDEX attendances_schedule_id_idx ON public.attendances(schedule_id);
CREATE INDEX attendances_siswa_id_idx    ON public.attendances(siswa_id);

ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;

-- Admin: akses penuh
CREATE POLICY "attendances_admin_all" ON public.attendances
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Tutor: SELECT absensi untuk jadwal yang diampu
CREATE POLICY "attendances_tutor_own_schedules" ON public.attendances
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.schedules s
            WHERE s.id = schedule_id AND s.tutor_id = auth.uid()
        )
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'tutor')
    );

-- Siswa: SELECT absensi diri sendiri
CREATE POLICY "attendances_siswa_own" ON public.attendances
    FOR SELECT TO authenticated
    USING (
        siswa_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'siswa')
    );

-- Siswa: INSERT absensi diri sendiri (via endpoint /join — backend upsert)
CREATE POLICY "attendances_siswa_insert_own" ON public.attendances
    FOR INSERT TO authenticated
    WITH CHECK (
        siswa_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'siswa')
    );
