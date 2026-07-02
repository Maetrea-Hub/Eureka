-- ─────────────────────────────────────────────────────────────
-- Migration 006 — Pembayaran, Enrollments, Refunds
-- Includes: Wire Known Gap #3 (materials RLS) & #4 (schedules RLS)
-- ─────────────────────────────────────────────────────────────

-- ── ENUM types ────────────────────────────────────────────────
CREATE TYPE public.order_status      AS ENUM ('pending','paid','expired','refunded','cancelled');
CREATE TYPE public.enrollment_status AS ENUM ('active','expired','cancelled','refunded');
CREATE TYPE public.refund_tipe       AS ENUM ('standard','force_majeure','trial_session');
CREATE TYPE public.refund_status     AS ENUM ('pending','approved','rejected');

-- ── ALTER programs: tambah durasi_hari ───────────────────────
-- NULL = enrollment tanpa expiry; diisi admin berbarengan dengan kolom durasi (text display)
ALTER TABLE public.programs
    ADD COLUMN durasi_hari INTEGER;

-- ── Table: orders ─────────────────────────────────────────────
CREATE TABLE public.orders (
    id                   UUID                NOT NULL DEFAULT gen_random_uuid(),
    siswa_id             UUID                NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    program_id           UUID                NOT NULL REFERENCES public.programs(id) ON DELETE RESTRICT,
    midtrans_order_id    TEXT                NOT NULL UNIQUE,
    snap_token           TEXT,
    nominal              NUMERIC(12,0)       NOT NULL CHECK (nominal > 0),
    status               public.order_status NOT NULL DEFAULT 'pending',
    payment_date         TIMESTAMPTZ,
    -- refund window: diset saat webhook paid → payment_date + 48h
    expired_at           TIMESTAMPTZ,
    -- Midtrans payment link expiry: diset saat create → NOW() + 24h
    order_expires_at     TIMESTAMPTZ         NOT NULL,
    created_at           TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    CONSTRAINT orders_pkey PRIMARY KEY (id)
);

CREATE INDEX ON public.orders (siswa_id);
CREATE INDEX ON public.orders (program_id);
CREATE INDEX ON public.orders (status);
CREATE INDEX ON public.orders (midtrans_order_id);

CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── Table: enrollments ────────────────────────────────────────
CREATE TABLE public.enrollments (
    id                  UUID                     NOT NULL DEFAULT gen_random_uuid(),
    siswa_id            UUID                     NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    program_id          UUID                     NOT NULL REFERENCES public.programs(id) ON DELETE RESTRICT,
    -- UNIQUE: satu order hanya bisa menghasilkan satu enrollment
    order_id            UUID                     NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE RESTRICT,
    status              public.enrollment_status NOT NULL DEFAULT 'active',
    enrolled_at         TIMESTAMPTZ              NOT NULL DEFAULT NOW(),
    -- NULL jika program.durasi_hari NULL; jika ada = enrolled_at + durasi_hari days
    expires_at          TIMESTAMPTZ,
    -- TRUE jika tidak ada enrollment sebelumnya (ANY status) untuk siswa ini
    is_first_enrollment BOOLEAN                  NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ              NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ              NOT NULL DEFAULT NOW(),
    CONSTRAINT enrollments_pkey PRIMARY KEY (id)
);

CREATE INDEX ON public.enrollments (siswa_id);
CREATE INDEX ON public.enrollments (program_id);
CREATE INDEX ON public.enrollments (status);

-- Partial unique: hanya satu enrollment AKTIF per siswa per program.
-- Memungkinkan re-enroll setelah expired/refunded/cancelled.
CREATE UNIQUE INDEX enrollments_siswa_program_active
    ON public.enrollments (siswa_id, program_id)
    WHERE status = 'active';

CREATE TRIGGER enrollments_updated_at
    BEFORE UPDATE ON public.enrollments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── Table: refund_requests ────────────────────────────────────
CREATE TABLE public.refund_requests (
    id              UUID                  NOT NULL DEFAULT gen_random_uuid(),
    -- UNIQUE: satu order hanya bisa punya satu refund request
    order_id        UUID                  NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE RESTRICT,
    siswa_id        UUID                  NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    alasan          TEXT                  NOT NULL,
    tipe            public.refund_tipe    NOT NULL DEFAULT 'standard',
    status          public.refund_status  NOT NULL DEFAULT 'pending',
    diproses_oleh   UUID                  REFERENCES public.profiles(id) ON DELETE SET NULL,
    diproses_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    CONSTRAINT refund_requests_pkey PRIMARY KEY (id)
);

CREATE INDEX ON public.refund_requests (siswa_id);
CREATE INDEX ON public.refund_requests (status);

-- ── Table: material_access ────────────────────────────────────
CREATE TABLE public.material_access (
    id                UUID        NOT NULL DEFAULT gen_random_uuid(),
    siswa_id          UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    material_id       UUID        NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
    first_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_accessed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT material_access_pkey        PRIMARY KEY (id),
    CONSTRAINT material_access_unique_pair UNIQUE (siswa_id, material_id)
);

CREATE INDEX ON public.material_access (siswa_id);
CREATE INDEX ON public.material_access (material_id);

-- ── RLS: orders ───────────────────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_siswa_read" ON public.orders
    FOR SELECT TO authenticated
    USING (
        siswa_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'siswa')
    );

CREATE POLICY "orders_admin_all" ON public.orders
    FOR ALL TO authenticated
    USING    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── RLS: enrollments ──────────────────────────────────────────
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrollments_siswa_read" ON public.enrollments
    FOR SELECT TO authenticated
    USING (
        siswa_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'siswa')
    );

CREATE POLICY "enrollments_tutor_read" ON public.enrollments
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'tutor'));

CREATE POLICY "enrollments_admin_all" ON public.enrollments
    FOR ALL TO authenticated
    USING    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── RLS: refund_requests ──────────────────────────────────────
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "refunds_siswa_read" ON public.refund_requests
    FOR SELECT TO authenticated
    USING (
        siswa_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'siswa')
    );

CREATE POLICY "refunds_admin_all" ON public.refund_requests
    FOR ALL TO authenticated
    USING    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── RLS: material_access ──────────────────────────────────────
ALTER TABLE public.material_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maccess_siswa_read" ON public.material_access
    FOR SELECT TO authenticated
    USING (
        siswa_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'siswa')
    );

CREATE POLICY "maccess_tutor_read" ON public.material_access
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'tutor'));

CREATE POLICY "maccess_admin_all" ON public.material_access
    FOR ALL TO authenticated
    USING    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── Wire Known Gap #3: materials_siswa_read_published ─────────
-- Siswa hanya bisa baca materi dari program yang mereka daftarkan (active enrollment)
-- Matching: jenjang program = jenjang materi, mata_pelajaran materi ⊆ mata_pelajaran program
DROP POLICY "materials_siswa_read_published" ON public.materials;

CREATE POLICY "materials_siswa_read_published" ON public.materials
    FOR SELECT TO authenticated
    USING (
        status = 'published'
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'siswa')
        AND EXISTS (
            SELECT 1
            FROM   public.enrollments e
            JOIN   public.programs    p ON e.program_id = p.id
            WHERE  e.siswa_id               = auth.uid()
              AND  e.status                 = 'active'
              AND  p.jenjang                = materials.jenjang
              AND  materials.mata_pelajaran = ANY(p.mata_pelajaran)
        )
    );

-- ── Wire Known Gap #4: schedules_siswa_read ───────────────────
-- Siswa hanya bisa lihat jadwal dari program yang mereka daftarkan (active enrollment)
DROP POLICY "schedules_siswa_read" ON public.schedules;

CREATE POLICY "schedules_siswa_read" ON public.schedules
    FOR SELECT TO authenticated
    USING (
        status != 'dibatalkan'
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'siswa')
        AND EXISTS (
            SELECT 1 FROM public.enrollments
            WHERE  siswa_id   = auth.uid()
              AND  program_id = schedules.program_id
              AND  status     = 'active'
        )
    );
