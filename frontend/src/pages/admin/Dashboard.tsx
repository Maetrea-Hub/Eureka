import {
  BarChart3, BookOpen, Calendar, CreditCard,
  FileText, LayoutDashboard, MessageSquare,
  Package, Settings2, Users,
} from 'lucide-react';
import { DashboardLayout, type NavItem } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAuth } from '@/hooks/useAuth';

const navItems: NavItem[] = [
  { label: 'Dashboard',         href: '/admin',  icon: LayoutDashboard },
  { label: 'Siswa',                              icon: Users },
  { label: 'Tutor',                              icon: Settings2 },
  { label: 'Pilihan Program',                    icon: Package },
  { label: 'Materi',                             icon: BookOpen },
  { label: 'Jadwal Kelas',                       icon: Calendar },
  { label: 'Pembayaran',                         icon: CreditCard },
  { label: 'Laporan Keuangan',                   icon: BarChart3 },
  { label: 'CRM',                                icon: MessageSquare },
  { label: 'Audit Log',                          icon: FileText },
];

export default function AdminDashboard() {
  const { profile } = useAuth();

  const firstName = profile?.nama_lengkap?.split(' ')[0] ?? 'Admin';

  return (
    <DashboardLayout navItems={navItems} pageTitle="Dashboard Admin">
      {/* Greeting */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Selamat datang, {firstName}! 👋</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ringkasan aktivitas platform Eureka
        </p>
      </div>

      {/* KPI Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Siswa"
          value={0}
          subtitle="Akun siswa terdaftar"
          icon={Users}
        />
        <StatCard
          title="Program Aktif"
          value={0}
          subtitle="Program yang tersedia"
          icon={Package}
        />
        <StatCard
          title="Pendapatan Bulan Ini"
          value="Rp 0"
          subtitle="Total transaksi berhasil"
          icon={CreditCard}
        />
        <StatCard
          title="Siswa Baru Bulan Ini"
          value={0}
          subtitle="Pendaftar baru bulan ini"
          icon={BarChart3}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent registrations */}
        <div>
          <h3 className="mb-3 text-base font-semibold">Pendaftaran Terbaru</h3>
          <EmptyState
            icon={Users}
            message="Belum ada pendaftaran"
            description="Siswa yang mendaftar baru-baru ini akan tampil di sini"
          />
        </div>

        {/* Recent payments */}
        <div>
          <h3 className="mb-3 text-base font-semibold">Pembayaran Terbaru</h3>
          <EmptyState
            icon={CreditCard}
            message="Belum ada transaksi"
            description="Transaksi pembayaran terbaru akan tampil di sini"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
