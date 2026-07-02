-- ─────────────────────────────────────────────────────────────
-- Migration 008 — Audit Log + CRM Notes
-- ─────────────────────────────────────────────────────────────

-- ── audit_logs ────────────────────────────────────────────────
CREATE TABLE public.audit_logs (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    actor_id    UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_role  TEXT,
    action      TEXT        NOT NULL,
    entity_type TEXT,
    entity_id   TEXT,
    detail      JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

CREATE INDEX ON public.audit_logs (actor_id);
CREATE INDEX ON public.audit_logs (action);
CREATE INDEX ON public.audit_logs (created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Hanya admin yang bisa baca audit log
CREATE POLICY "audit_admin_select" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ── crm_notes ─────────────────────────────────────────────────
CREATE TABLE public.crm_notes (
    id         UUID        NOT NULL DEFAULT gen_random_uuid(),
    siswa_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    catatan    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT crm_notes_pkey PRIMARY KEY (id)
);

CREATE INDEX ON public.crm_notes (siswa_id);

ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;

-- Hanya admin yang bisa CRUD crm_notes
CREATE POLICY "crm_admin_all" ON public.crm_notes
    FOR ALL TO authenticated
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
