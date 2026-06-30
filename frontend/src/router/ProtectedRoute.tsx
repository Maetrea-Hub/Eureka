import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, profile } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Profile belum ada (mungkin sedang load) — tunggu
  if (!profile) return null;

  // Onboarding belum selesai — paksa ke halaman onboarding
  if (!profile.onboarding_completed) {
    const isGoogleUser = !profile.nomor_whatsapp;
    return <Navigate to={isGoogleUser ? '/onboarding/google' : '/onboarding'} replace />;
  }

  // Cek role jika route mensyaratkan role tertentu
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // Redirect ke dashboard sesuai role masing-masing
    const dashboardByRole: Record<UserRole, string> = {
      siswa: '/siswa',
      tutor: '/tutor',
      admin: '/admin',
    };
    return <Navigate to={dashboardByRole[profile.role]} replace />;
  }

  return <>{children}</>;
}
