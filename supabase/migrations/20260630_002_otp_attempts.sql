-- ================================================================
-- FILE: supabase/migrations/20260630_002_otp_attempts.sql
-- Tambah kolom otp_attempts untuk limit percobaan verifikasi OTP
-- ================================================================

ALTER TABLE public.admin_otp_sessions
  ADD COLUMN otp_attempts INTEGER NOT NULL DEFAULT 0;

-- Function atomic increment — menghindari race condition read-then-write
CREATE OR REPLACE FUNCTION public.increment_otp_attempts(session_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_attempts INTEGER;
BEGIN
  UPDATE public.admin_otp_sessions
  SET otp_attempts = otp_attempts + 1
  WHERE id = session_id
  RETURNING otp_attempts INTO new_attempts;
  RETURN COALESCE(new_attempts, 0);
END;
$$;
