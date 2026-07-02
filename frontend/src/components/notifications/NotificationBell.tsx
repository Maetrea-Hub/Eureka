import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { KATEGORI_ICON } from '@/lib/notifications-api';
import { cn } from '@/lib/utils';

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  if (mins < 60)    return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24)   return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

export function NotificationBell() {
  const { profile }                                    = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen]                                = useState(false);
  const navigate                                       = useNavigate();

  const role = profile?.role ?? 'siswa';
  const recent = notifications.slice(0, 10);

  function handleNotifClick(id: string, dibaca: boolean) {
    if (!dibaca) markRead(id);
  }

  function handleViewAll() {
    setOpen(false);
    navigate(`/${role}/notifications`);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title="Notifikasi">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -right-1 -top-1 h-4 min-w-4 justify-center px-1 py-0 text-[10px]"
              variant="destructive"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">Notifikasi</span>
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => markAllRead()}
            >
              Tandai semua dibaca
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto">
          {recent.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Tidak ada notifikasi
            </p>
          ) : (
            recent.map((n) => (
              <button
                key={n.id}
                type="button"
                className={cn(
                  'flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60',
                  !n.dibaca && 'bg-primary/5',
                )}
                onClick={() => handleNotifClick(n.id, n.dibaca)}
              >
                <span className="mt-0.5 flex-shrink-0 text-base">
                  {KATEGORI_ICON[n.kategori] ?? '🔔'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn('truncate text-sm', !n.dibaca && 'font-medium')}>
                    {n.judul}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {n.pesan}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground/70">
                    {formatRelative(n.created_at)}
                  </p>
                </div>
                {!n.dibaca && (
                  <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t">
          <button
            type="button"
            className="w-full py-2.5 text-center text-xs text-primary hover:bg-secondary/40"
            onClick={handleViewAll}
          >
            Lihat semua notifikasi
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
