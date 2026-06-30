import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// ── Lazy load semua halaman ───────────────────────────────────
const Register          = lazy(() => import('@/pages/auth/Register'));
const LoginSiswa        = lazy(() => import('@/pages/auth/LoginSiswa'));
const LoginAdmin        = lazy(() => import('@/pages/auth/LoginAdmin'));
const ForgotPassword    = lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword     = lazy(() => import('@/pages/auth/ResetPassword'));
const Onboarding        = lazy(() => import('@/pages/auth/Onboarding'));
const OnboardingGoogle  = lazy(() => import('@/pages/auth/OnboardingGoogle'));
const SiswaDashboard    = lazy(() => import('@/pages/siswa/Dashboard'));
const TutorDashboard    = lazy(() => import('@/pages/tutor/Dashboard'));
const AdminDashboard    = lazy(() => import('@/pages/admin/Dashboard'));

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

export const router = createBrowserRouter([
  // ── Public routes ─────────────────────────────────────────
  { path: '/register',          element: <Suspense fallback={<PageLoader />}><Register /></Suspense> },
  { path: '/login',             element: <Suspense fallback={<PageLoader />}><LoginSiswa /></Suspense> },
  { path: '/login/admin',       element: <Suspense fallback={<PageLoader />}><LoginAdmin /></Suspense> },
  { path: '/forgot-password',   element: <Suspense fallback={<PageLoader />}><ForgotPassword /></Suspense> },
  { path: '/reset-password',    element: <Suspense fallback={<PageLoader />}><ResetPassword /></Suspense> },

  // ── Onboarding (butuh auth, belum butuh role) ────────────
  { path: '/onboarding',        element: <Suspense fallback={<PageLoader />}><Onboarding /></Suspense> },
  { path: '/onboarding/google', element: <Suspense fallback={<PageLoader />}><OnboardingGoogle /></Suspense> },

  // ── Protected routes per role ─────────────────────────────
  {
    path: '/siswa',
    element: (
      <ProtectedRoute allowedRoles={['siswa']}>
        <Suspense fallback={<PageLoader />}><SiswaDashboard /></Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/tutor',
    element: (
      <ProtectedRoute allowedRoles={['tutor']}>
        <Suspense fallback={<PageLoader />}><TutorDashboard /></Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>
      </ProtectedRoute>
    ),
  },

  // ── Fallback ──────────────────────────────────────────────
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/login" replace /> },
]);
