import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { OnboardingForm } from '@/components/auth/OnboardingForm';

export default function Onboarding() {
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
      subtitle="Satu langkah lagi sebelum mulai belajar"
    >
      <OnboardingForm />
    </AuthLayout>
  );
}
