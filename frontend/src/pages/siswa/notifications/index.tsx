import {
  Bell, BookOpen, Calendar, CreditCard, LayoutDashboard, Package,
} from 'lucide-react';
import { DashboardLayout, type NavItem } from '@/components/dashboard/DashboardLayout';
import { NotificationsList } from '@/components/notifications/NotificationsList';

const navItems: NavItem[] = [
  { label: 'Dashboard',     href: '/siswa',               icon: LayoutDashboard },
  { label: 'Program Saya',  href: '/siswa/programs',      icon: Package },
  { label: 'Materi',        href: '/siswa/materials',     icon: BookOpen },
  { label: 'Jadwal Kelas',  href: '/siswa/schedules',     icon: Calendar },
  { label: 'Pembayaran',    href: '/siswa/transactions',  icon: CreditCard },
  { label: 'Notifikasi',    href: '/siswa/notifications', icon: Bell },
];

export default function SiswaNotifications() {
  return (
    <DashboardLayout navItems={navItems} pageTitle="Notifikasi">
      <NotificationsList />
    </DashboardLayout>
  );
}
