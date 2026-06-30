-- ================================================================
-- FILE: supabase/migrations/20260630_001_auth_setup.sql
-- Platform: Eureka — E-Learning Bimbel Online
-- HANYA jalankan di development project (bukan production)
-- ================================================================

-- ----------------------------------------------------------------
-- ENUM role
-- ----------------------------------------------------------------
CREATE TYPE public.user_role AS ENUM ('siswa', 'tutor', 'admin');

-- ----------------------------------------------------------------
-- TABEL: profiles
-- Extend dari auth.users, relasi 1:1
-- ----------------------------------------------------------------
CREATE TABLE public.profiles (
  id                   UUID              PRIMARY KEY
                                         REFERENCES auth.users(id) ON DELETE CASCADE,
  role                 public.user_role  NOT NULL DEFAULT 'siswa',
  nama_lengkap         TEXT              NOT NULL DEFAULT '',
  nomor_whatsapp       TEXT,
  jenjang_sekolah      TEXT              CHECK (jenjang_sekolah IN ('SD', 'SMP', 'SMA')),
  foto_url             TEXT,
  onboarding_completed BOOLEAN           NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ       NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- TABEL: admin_otp_sessions
-- Menyimpan sesi 2FA sementara Admin sebelum OTP dikonfirmasi.
-- access_token + refresh_token dienkripsi AES-256-GCM di backend
-- sebelum disimpan — tidak bisa dibaca meski baris ini bocor.
-- Format kolom encrypted_*: <iv_hex>:<ciphertext_hex>:<authtag_hex>
-- ----------------------------------------------------------------
CREATE TABLE public.admin_otp_sessions (
  id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id                 UUID         NOT NULL
                                        REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Dikirim ke frontend setelah password benar; dipakai saat verifikasi OTP
  temp_token               UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  -- OTP di-hash bcrypt cost 12 — tidak pernah disimpan plain text
  otp_hash                 TEXT         NOT NULL,
  -- Supabase tokens dienkripsi AES-256-GCM oleh backend
  encrypted_access_token   TEXT         NOT NULL,
  encrypted_refresh_token  TEXT         NOT NULL,
  expires_at               TIMESTAMPTZ  NOT NULL,   -- now() + 5 menit
  used                     BOOLEAN      NOT NULL DEFAULT false,
  -- Disimpan untuk keperluan audit log, bukan rate limiting
  created_from_ip          INET,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_otp_temp_token  ON public.admin_otp_sessions(temp_token);
CREATE INDEX idx_otp_admin_id    ON public.admin_otp_sessions(admin_id);
CREATE INDEX idx_otp_expires_at  ON public.admin_otp_sessions(expires_at);

-- ----------------------------------------------------------------
-- TRIGGER: auto-update updated_at pada profiles
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------
-- TRIGGER: auto-insert profil saat user baru terdaftar di auth.users
-- Menangani Email/Password signup dan Google OAuth.
-- SECURITY DEFINER diperlukan agar function bisa akses auth schema.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role public.user_role;
BEGIN
  v_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    'siswa'
  );

  INSERT INTO public.profiles (id, nama_lengkap, role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'nama_lengkap',  -- form registrasi Email/Pass
      NEW.raw_user_meta_data->>'full_name',       -- Google OAuth
      ''
    ),
    v_role
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- RLS: profiles
-- ================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- [1] User baca profil sendiri
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- [2] User update profil sendiri
--     Kolom `role` tidak bisa diubah user — Admin ubah role via
--     service role key di backend (bypass RLS)
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- [3] Admin baca semua profil
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- [4] Admin update semua profil (termasuk ganti role)
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- [5] Admin delete profil
CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ================================================================
-- RLS: admin_otp_sessions
-- Tidak ada policy untuk role `authenticated` —
-- semua akses dari client ditolak by default.
-- Hanya bisa diakses via backend menggunakan service_role key.
-- ================================================================
ALTER TABLE public.admin_otp_sessions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- FUNCTION: bersihkan OTP expired
-- Dipanggil backend setiap ada POST /auth/admin/login baru —
-- menghindari akumulasi baris lama tanpa dependency pg_cron.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_sessions()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM public.admin_otp_sessions
  WHERE expires_at < now() OR used = true;
END;
$$;
