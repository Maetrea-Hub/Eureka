import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginSiswaForm } from '@/components/auth/LoginSiswaForm';

export default function LoginTutor() {
  return (
    <AuthLayout
      title="Masuk sebagai Tutor"
      subtitle="Selamat datang kembali! Masuk untuk mengelola kelas dan materi."
    >
      <LoginSiswaForm redirectTo="/tutor" />
      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Link to="/login" className="hover:underline">
          ← Kembali ke login Siswa
        </Link>
      </p>
    </AuthLayout>
  );
}
