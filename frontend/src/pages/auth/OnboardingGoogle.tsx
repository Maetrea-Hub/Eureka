import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { GoogleOnboardingForm } from '@/components/auth/GoogleOnboardingForm';

export default function OnboardingGoogle() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <AuthLayout
      title="Lengkapi Profil"
      subtitle="Masukkan nomor WhatsApp untuk menerima notifikasi belajar"
    >
      <GoogleOnboardingForm />
    </AuthLayout>
  );
}
