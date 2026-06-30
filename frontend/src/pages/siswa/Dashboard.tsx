import {
  BookOpen, Calendar, CreditCard, LayoutDashboard, Package,
} from 'lucide-react';
import { DashboardLayout, type NavItem } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAuth } from '@/hooks/useAuth';

const navItems: NavItem[] = [
  { label: 'Dashboard',      href: '/siswa',          icon: LayoutDashboard },
  { label: 'Program Saya',                            icon: Package },
  { label: 'Jadwal Kelas',                                      icon: Calendar },
  { label: 'Materi',       href: '/siswa/materials',           icon: BookOpen },
  { label: 'Pembayaran',                              icon: CreditCard },
];

export default function SiswaDashboard() {
  const { profile } = useAuth();

  const firstName = profile?.nama_lengkap?.split(' ')[0] ?? 'Siswa';

  return (
    <DashboardLayout navItems={navItems} pageTitle="Dashboard">
      {/* Greeting */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Selamat datang, {firstName}! 👋</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Jenjang: {profile?.jenjang_sekolah ?? '—'}
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Program Aktif"
          value={0}
          subtitle="Belum ada program yang dibeli"
          icon={Package}
        />
        <StatCard
          title="Kelas Hari Ini"
          value={0}
          subtitle="Tidak ada jadwal hari ini"
          icon={Calendar}
        />
        <StatCard
          title="Materi Tersedia"
          value={0}
          subtitle="Beli program untuk akses materi"
          icon={BookOpen}
        />
      </div>

      {/* Upcoming schedule */}
      <div className="mb-6">
        <h3 className="mb-3 text-base font-semibold">Jadwal Kelas Berikutnya</h3>
        <EmptyState
          icon={Calendar}
          message="Belum ada jadwal kelas"
          description="Jadwal kelas akan muncul di sini setelah Anda mendaftar program"
        />
      </div>

      {/* Recent materials */}
      <div>
        <h3 className="mb-3 text-base font-semibold">Materi Terbaru</h3>
        <EmptyState
          icon={BookOpen}
          message="Belum ada materi tersedia"
          description="Daftar program belajar untuk mengakses materi dari tutor terbaik kami"
        />
      </div>
    </DashboardLayout>
  );
}
