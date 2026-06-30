-- ─────────────────────────────────────────────────────────────
-- Migration 003 — Pilihan Program
-- ENUM jenjang menggunakan UPPERCASE ('SD','SMP','SMA')
-- untuk konsisten dengan profiles.jenjang_sekolah
-- ─────────────────────────────────────────────────────────────

-- ── ENUM types ────────────────────────────────────────────────
CREATE TYPE public.tipe_layanan   AS ENUM ('private', 'small_class', 'regular_class');
CREATE TYPE public.jenjang_level  AS ENUM ('SD', 'SMP', 'SMA');

-- ── Table: programs ───────────────────────────────────────────
CREATE TABLE public.programs (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    nama           TEXT          NOT NULL,
    tipe_layanan   public.tipe_layanan  NOT NULL,
    jenjang        public.jenjang_level NOT NULL,

    -- TEXT[] dengan CHECK subset dari 6 mata pelajaran yang valid
    mata_pelajaran TEXT[]        NOT NULL DEFAULT '{}'
        CONSTRAINT valid_mata_pelajaran CHECK (
            mata_pelajaran <@ ARRAY[
                'ipa_terpadu','matematika','b_inggris',
                'biologi','fisika','kimia'
            ]::TEXT[]
        ),

    durasi         TEXT          NOT NULL,
    kapasitas      INTEGER       NOT NULL CHECK (kapasitas >= 1),
    tarif          NUMERIC(12,0) NOT NULL CHECK (tarif >= 0),
    status         BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Trigger: auto-update updated_at ──────────────────────────
-- Reuse handle_updated_at() dari migration 001
CREATE TRIGGER programs_updated_at
    BEFORE UPDATE ON public.programs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- Admin: full access (SELECT + INSERT + UPDATE + DELETE)
CREATE POLICY "programs_admin_all" ON public.programs
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Siswa & Tutor: read-only, program aktif saja
CREATE POLICY "programs_users_read_active" ON public.programs
    FOR SELECT
    TO authenticated
    USING (
        status = TRUE
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('siswa', 'tutor')
        )
    );
