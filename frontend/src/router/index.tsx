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
const AdminPrograms     = lazy(() => import('@/pages/admin/programs/index'));
const AdminMaterials    = lazy(() => import('@/pages/admin/materials/index'));
const TutorMaterials    = lazy(() => import('@/pages/tutor/materials/index'));
const SiswaMaterials    = lazy(() => import('@/pages/siswa/materials/index'));
const AdminSchedules    = lazy(() => import('@/pages/admin/schedules/index'));
const TutorSchedules    = lazy(() => import('@/pages/tutor/schedules/index'));
const SiswaSchedules    = lazy(() => import('@/pages/siswa/schedules/index'));
const SiswaPrograms     = lazy(() => import('@/pages/siswa/programs/index'));
const SiswaTransactions      = lazy(() => import('@/pages/siswa/transactions/index'));
const AdminRefunds           = lazy(() => import('@/pages/admin/refunds/index'));
const SiswaNotifications     = lazy(() => import('@/pages/siswa/notifications/index'));
const TutorNotifications     = lazy(() => import('@/pages/tutor/notifications/index'));
const AdminNotifications     = lazy(() => import('@/pages/admin/notifications/index'));
const AdminFinance           = lazy(() => import('@/pages/admin/finance/index'));
const AdminAudit             = lazy(() => import('@/pages/admin/audit/index'));
const AdminCrm               = lazy(() => import('@/pages/admin/crm/index'));

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
  {
    path: '/admin/programs',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <Suspense fallback={<PageLoader />}><AdminPrograms /></Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: '/siswa/materials',
    element: (
      <ProtectedRoute allowedRoles={['siswa']}>
        <Suspense fallback={<PageLoader />}><SiswaMaterials /></Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/tutor/materials',
    element: (
      <ProtectedRoute allowedRoles={['tutor']}>
        <Suspense fallback={<PageLoader />}><TutorMaterials /></Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/materials',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <Suspense fallback={<PageLoader />}><AdminMaterials /></Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/siswa/schedules',
    element: (
      <ProtectedRoute allowedRoles={['siswa']}>
        <Suspense fallback={<PageLoader />}><SiswaSchedules /></Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/tutor/schedules',
    element: (
      <ProtectedRoute allowedRoles={['tutor']}>
        <Suspense fallback={<PageLoader />}><TutorSchedules /></Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/schedules',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <Suspense fallback={<PageLoader />}><AdminSchedules /></Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: '/siswa/programs',
    element: (
      <ProtectedRoute allowedRoles={['siswa']}>
        <Suspense fallback={<PageLoader />}><SiswaPrograms /></Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/siswa/transactions',
    element: (
      <ProtectedRoute allowedRoles={['siswa']}>
        <Suspense fallback={<PageLoader />}><SiswaTransactions /></Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/refunds',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <Suspense fallback={<PageLoader />}><AdminRefunds /></Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/siswa/notifications',
    element: (
      <ProtectedRoute allowedRoles={['siswa']}>
        <Suspense fallback={<PageLoader />}><SiswaNotifications /></Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/tutor/notifications',
    element: (
      <ProtectedRoute allowedRoles={['tutor']}>
        <Suspense fallback={<PageLoader />}><TutorNotifications /></Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/notifications',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <Suspense fallback={<PageLoader />}><AdminNotifications /></Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/finance',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <Suspense fallback={<PageLoader />}><AdminFinance /></Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/audit',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <Suspense fallback={<PageLoader />}><AdminAudit /></Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/crm',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <Suspense fallback={<PageLoader />}><AdminCrm /></Suspense>
      </ProtectedRoute>
    ),
  },

  // ── Fallback ──────────────────────────────────────────────
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/login" replace /> },
]);
