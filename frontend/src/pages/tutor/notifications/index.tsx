import {
  Bell, BookOpen, Calendar, LayoutDashboard, Users,
} from 'lucide-react';
import { DashboardLayout, type NavItem } from '@/components/dashboard/DashboardLayout';
import { NotificationsList } from '@/components/notifications/NotificationsList';

const navItems: NavItem[] = [
  { label: 'Dashboard',   href: '/tutor',               icon: LayoutDashboard },
  { label: 'Siswa',                                     icon: Users },
  { label: 'Materi',      href: '/tutor/materials',     icon: BookOpen },
  { label: 'Jadwal',      href: '/tutor/schedules',     icon: Calendar },
  { label: 'Notifikasi',  href: '/tutor/notifications', icon: Bell },
];

export default function TutorNotifications() {
  return (
    <DashboardLayout navItems={navItems} pageTitle="Notifikasi">
      <NotificationsList />
    </DashboardLayout>
  );
}
