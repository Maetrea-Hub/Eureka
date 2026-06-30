-- ─────────────────────────────────────────────────────────────
-- Migration 004 — Manajemen Materi
-- Single table "materials" dengan kolom nullable per tipe.
-- Tabel "questions" terpisah untuk Bank Soal.
-- jenjang_level ENUM sudah ada dari migration 003 — dipakai ulang.
-- ─────────────────────────────────────────────────────────────

-- ── ENUM types ────────────────────────────────────────────────
CREATE TYPE public.material_tipe   AS ENUM ('dokumen', 'video', 'bank_soal');
CREATE TYPE public.material_status AS ENUM ('draft', 'published', 'nonaktif');
CREATE TYPE public.file_type       AS ENUM ('pdf', 'ppt', 'docx', 'epub');
CREATE TYPE public.tipe_soal       AS ENUM ('pilihan_ganda', 'essay');

-- ── Table: materials ──────────────────────────────────────────
CREATE TABLE public.materials (
    id             UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    judul          TEXT                    NOT NULL,
    jenjang        public.jenjang_level    NOT NULL,
    mata_pelajaran TEXT                    NOT NULL
        CONSTRAINT valid_mapel_material CHECK (
            mata_pelajaran IN (
                'ipa_terpadu','matematika','b_inggris',
                'biologi','fisika','kimia'
            )
        ),
    topik          TEXT                    NOT NULL,
    tipe           public.material_tipe    NOT NULL,
    tutor_id       UUID                    NOT NULL
        REFERENCES public.profiles(id) ON DELETE RESTRICT,
    status         public.material_status  NOT NULL DEFAULT 'draft',

    -- ── Tab Dokumen (nullable, hanya relevan jika tipe='dokumen') ──
    file_url       TEXT,
    file_type      public.file_type,
    bisa_download  BOOLEAN                 NOT NULL DEFAULT FALSE,

    -- ── Tab Video (nullable, hanya relevan jika tipe='video') ─────
    video_url      TEXT,
    duration_seconds INTEGER,

    created_at     TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

-- ── Trigger: auto-update updated_at ──────────────────────────
CREATE TRIGGER materials_updated_at
    BEFORE UPDATE ON public.materials
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── RLS: materials ────────────────────────────────────────────
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Admin: akses penuh semua materi
CREATE POLICY "materials_admin_all" ON public.materials
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role = 'admin')
    );

-- Tutor: SELECT materi milik sendiri (semua status termasuk draft)
CREATE POLICY "materials_tutor_select_own" ON public.materials
    FOR SELECT TO authenticated
    USING (
        tutor_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role = 'tutor')
    );

-- Tutor: INSERT — tutor_id wajib = auth.uid()
CREATE POLICY "materials_tutor_insert" ON public.materials
    FOR INSERT TO authenticated
    WITH CHECK (
        tutor_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role = 'tutor')
    );

-- Tutor: UPDATE materi milik sendiri
CREATE POLICY "materials_tutor_update_own" ON public.materials
    FOR UPDATE TO authenticated
    USING (
        tutor_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role = 'tutor')
    )
    WITH CHECK (
        tutor_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role = 'tutor')
    );

-- Tutor: DELETE materi milik sendiri
-- (service layer cek isAccessed() sebelum sampai ke sini)
CREATE POLICY "materials_tutor_delete_own" ON public.materials
    FOR DELETE TO authenticated
    USING (
        tutor_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role = 'tutor')
    );

-- Siswa: READ materi published saja
-- TODO Blok 12: perketat dengan filter program enrollment —
--   tambah: AND EXISTS (SELECT 1 FROM enrollments
--             WHERE siswa_id = auth.uid()
--             AND program_id IN (
--               SELECT program_id FROM program_materials
--               WHERE material_id = materials.id
--             ))
CREATE POLICY "materials_siswa_read_published" ON public.materials
    FOR SELECT TO authenticated
    USING (
        status = 'published'
        AND EXISTS (SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role = 'siswa')
    );

-- ── Table: questions ──────────────────────────────────────────
CREATE TABLE public.questions (
    id                   UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id          UUID                 NOT NULL
        REFERENCES public.materials(id) ON DELETE CASCADE,
    pertanyaan           TEXT                 NOT NULL,
    tipe_soal            public.tipe_soal     NOT NULL,
    -- Array of {text: string, is_correct: boolean} untuk pilihan_ganda
    opsi_jawaban         JSONB,
    pembahasan           TEXT,
    ada_timer            BOOLEAN              NOT NULL DEFAULT FALSE,
    durasi_timer_detik   INTEGER,
    urutan               INTEGER              NOT NULL DEFAULT 1,
    created_at           TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

CREATE INDEX questions_material_id_idx ON public.questions(material_id);
CREATE INDEX questions_urutan_idx      ON public.questions(material_id, urutan);

-- ── RLS: questions ────────────────────────────────────────────
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Admin: akses penuh
CREATE POLICY "questions_admin_all" ON public.questions
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role = 'admin')
    );

-- Tutor: CRUD soal untuk materi milik sendiri
CREATE POLICY "questions_tutor_own" ON public.questions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.materials m
            WHERE m.id = material_id
              AND m.tutor_id = auth.uid()
        )
        AND EXISTS (SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role = 'tutor')
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.materials m
            WHERE m.id = material_id
              AND m.tutor_id = auth.uid()
        )
        AND EXISTS (SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role = 'tutor')
    );

-- Siswa: READ soal dari materi published saja
CREATE POLICY "questions_siswa_published" ON public.questions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.materials m
            WHERE m.id = material_id
              AND m.status = 'published'
        )
        AND EXISTS (SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role = 'siswa')
    );
