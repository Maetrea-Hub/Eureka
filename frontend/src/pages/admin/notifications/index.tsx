import {
  BarChart3, Bell, BookOpen, Calendar, CreditCard,
  FileText, LayoutDashboard, MessageSquare, Package, RotateCcw, Settings2, Users,
} from 'lucide-react';
import { DashboardLayout, type NavItem } from '@/components/dashboard/DashboardLayout';
import { NotificationsList } from '@/components/notifications/NotificationsList';

const navItems: NavItem[] = [
  { label: 'Dashboard',        href: '/admin',                icon: LayoutDashboard },
  { label: 'Siswa',                                           icon: Users },
  { label: 'Tutor',                                           icon: Settings2 },
  { label: 'Pilihan Program',  href: '/admin/programs',       icon: Package },
  { label: 'Materi',           href: '/admin/materials',      icon: BookOpen },
  { label: 'Jadwal Kelas',     href: '/admin/schedules',      icon: Calendar },
  { label: 'Pembayaran',                                      icon: CreditCard },
  { label: 'Refund Requests',  href: '/admin/refunds',        icon: RotateCcw },
  { label: 'Notifikasi',       href: '/admin/notifications',  icon: Bell },
  { label: 'Laporan Keuangan', href: '/admin/finance', icon: BarChart3 },
  { label: 'CRM',              href: '/admin/crm',     icon: MessageSquare },
  { label: 'Audit Log',        href: '/admin/audit',   icon: FileText },
];

export default function AdminNotifications() {
  return (
    <DashboardLayout navItems={navItems} pageTitle="Notifikasi">
      <NotificationsList />
    </DashboardLayout>
  );
}
