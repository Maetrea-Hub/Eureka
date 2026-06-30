import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function Register() {
  return (
    <AuthLayout
      title="Daftar Akun Siswa"
      subtitle="Bergabung dan mulai belajar bersama tutor terbaik"
    >
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Sudah punya akun?{' '}
        <Link to="/login" className="font-medium text-foreground hover:underline">
          Masuk
        </Link>
      </p>
    </AuthLayout>
  );
}
