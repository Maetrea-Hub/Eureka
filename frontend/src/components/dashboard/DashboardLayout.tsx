import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href?: string; // undefined = belum diimplementasikan
}

interface Props {
  children: ReactNode;
  navItems: NavItem[];
  pageTitle: string;
}

export function DashboardLayout({ children, navItems, pageTitle }: Props) {
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const initials = profile?.nama_lengkap
    ? profile.nama_lengkap
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  function handleDisabledNav() {
    toast.info('Fitur ini akan segera hadir');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className="flex w-60 flex-shrink-0 flex-col border-r bg-card">
        {/* Logo */}
        <div className="flex h-16 items-center px-6">
          <span className="text-xl font-extrabold tracking-tight">Eureka</span>
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const active = item.href ? location.pathname === item.href : false;

            if (item.href) {
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                onClick={handleDisabledNav}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/60 transition-colors hover:bg-secondary/50"
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
                <span className="ml-auto rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Segera
                </span>
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <Separator />
        <div className="p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar className="h-8 w-8 flex-shrink-0">
              {profile?.foto_url && <AvatarImage src={profile.foto_url} alt={profile.nama_lengkap} />}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-tight">
                {profile?.nama_lengkap ?? '...'}
              </p>
              <p className="text-xs capitalize text-muted-foreground">{profile?.role ?? ''}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
              onClick={signOut}
              title="Keluar"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Main area ──────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b bg-card px-6">
          <h1 className="text-lg font-semibold">{pageTitle}</h1>
          <NotificationBell />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
