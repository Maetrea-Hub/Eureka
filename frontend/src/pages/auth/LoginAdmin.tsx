import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginAdminForm } from '@/components/auth/LoginAdminForm';

export default function LoginAdmin() {
  return (
    <AuthLayout
      title="Login Admin"
      subtitle="Masuk dengan verifikasi 2 langkah via WhatsApp"
    >
      <LoginAdminForm />
      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Link to="/login" className="hover:underline">
          ← Kembali ke halaman utama
        </Link>
      </p>
    </AuthLayout>
  );
}
