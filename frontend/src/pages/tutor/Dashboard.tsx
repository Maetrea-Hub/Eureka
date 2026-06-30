import {
  BookOpen, Calendar, LayoutDashboard, Users,
} from 'lucide-react';
import { DashboardLayout, type NavItem } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAuth } from '@/hooks/useAuth';

const navItems: NavItem[] = [
  { label: 'Dashboard',       href: '/tutor',  icon: LayoutDashboard },
  { label: 'Kelola Jadwal',                    icon: Calendar },
  { label: 'Kelola Materi',  href: '/tutor/materials', icon: BookOpen },
  { label: 'Daftar Siswa',                     icon: Users },
];

export default function TutorDashboard() {
  const { profile } = useAuth();

  const firstName = profile?.nama_lengkap?.split(' ')[0] ?? 'Tutor';

  return (
    <DashboardLayout navItems={navItems} pageTitle="Dashboard Tutor">
      {/* Greeting */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Selamat datang, {firstName}! 👋</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola jadwal dan materi pembelajaran Anda dari sini
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Siswa Aktif"
          value={0}
          subtitle="Siswa yang mengikuti program Anda"
          icon={Users}
        />
        <StatCard
          title="Jadwal Hari Ini"
          value={0}
          subtitle="Tidak ada kelas hari ini"
          icon={Calendar}
        />
        <StatCard
          title="Total Materi"
          value={0}
          subtitle="Materi yang telah dipublish"
          icon={BookOpen}
        />
      </div>

      {/* Today's schedule */}
      <div className="mb-6">
        <h3 className="mb-3 text-base font-semibold">Jadwal Hari Ini</h3>
        <EmptyState
          icon={Calendar}
          message="Tidak ada jadwal hari ini"
          description="Buat jadwal kelas baru dari menu Kelola Jadwal"
        />
      </div>

      {/* Recent students */}
      <div>
        <h3 className="mb-3 text-base font-semibold">Siswa Terbaru</h3>
        <EmptyState
          icon={Users}
          message="Belum ada siswa terdaftar"
          description="Siswa yang mendaftar program Anda akan muncul di sini"
        />
      </div>
    </DashboardLayout>
  );
}
