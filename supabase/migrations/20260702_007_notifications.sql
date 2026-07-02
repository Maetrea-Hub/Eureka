-- ─────────────────────────────────────────────────────────────
-- Migration 007 — Notifications + recording_url
-- ─────────────────────────────────────────────────────────────

-- ── ALTER schedules: tambah kolom recording_url ───────────────
-- Diisi oleh Zoom webhook recording.completed
ALTER TABLE public.schedules ADD COLUMN recording_url TEXT;

-- ── ENUM: kategori notifikasi (16 nilai dari 14 kategori) ─────
-- Beberapa kategori punya 2 trigger (H-1/H-0, H-7/H-3) → 16 ENUM
CREATE TYPE public.notification_kategori AS ENUM (
    'pengingat_jadwal_h1',
    'pengingat_jadwal_h0',
    'pengingat_kelas_15menit',
    'kelas_dibatalkan',
    'kelas_dijadwalkan_ulang',
    'pembayaran_berhasil',
    'pembayaran_gagal',
    'perpanjangan_h7',
    'perpanjangan_h3',
    'refund_diproses',
    'materi_baru',
    'rekaman_tersedia',
    'verifikasi_email',
    'password_diubah',
    'siswa_baru_daftar',
    'refund_masuk'
);

-- ── Table: notifications ──────────────────────────────────────
CREATE TABLE public.notifications (
    id         UUID                           NOT NULL DEFAULT gen_random_uuid(),
    user_id    UUID                           NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    kategori   public.notification_kategori   NOT NULL,
    judul      TEXT                           NOT NULL,
    pesan      TEXT                           NOT NULL,
    dibaca     BOOLEAN                        NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ                    NOT NULL DEFAULT NOW(),
    CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

CREATE INDEX ON public.notifications (user_id);
CREATE INDEX ON public.notifications (dibaca);
CREATE INDEX ON public.notifications (created_at DESC);

-- ── RLS: notifications ────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- User hanya bisa baca notifikasi miliknya sendiri
CREATE POLICY "notif_own_select" ON public.notifications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- User hanya bisa update (mark read) notifikasi miliknya sendiri
CREATE POLICY "notif_own_update" ON public.notifications
    FOR UPDATE TO authenticated
    USING    (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ── Supabase Realtime: aktifkan untuk tabel notifications ─────
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
