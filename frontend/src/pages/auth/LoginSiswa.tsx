import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginSiswaForm } from '@/components/auth/LoginSiswaForm';

export default function LoginSiswa() {
  return (
    <AuthLayout
      title="Masuk"
      subtitle="Selamat datang kembali! Masuk untuk melanjutkan belajar."
    >
      <LoginSiswaForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Belum punya akun?{' '}
        <Link to="/register" className="font-medium text-foreground hover:underline">
          Daftar gratis
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        <Link to="/login/admin" className="hover:underline">
          Masuk sebagai Admin
        </Link>
      </p>
    </AuthLayout>
  );
}
