import { useNotifications } from '@/hooks/useNotifications';
import { KATEGORI_ICON } from '@/lib/notifications-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('id-ID', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

export function NotificationsList() {
  const { notifications, unreadCount, isLoading, markRead, markAllRead } = useNotifications();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Semua Notifikasi</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Tandai semua dibaca
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed py-16 text-center">
          <p className="text-muted-foreground">Tidak ada notifikasi</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                'flex gap-4 rounded-lg border p-4 transition-colors',
                !n.dibaca ? 'border-primary/20 bg-primary/5' : 'bg-card',
              )}
            >
              <span className="mt-0.5 flex-shrink-0 text-xl">
                {KATEGORI_ICON[n.kategori] ?? '🔔'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn('text-sm', !n.dibaca && 'font-semibold')}>{n.judul}</p>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {!n.dibaca && (
                      <Badge variant="default" className="text-[10px]">Baru</Badge>
                    )}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(n.created_at)}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
                  {n.pesan}
                </p>
                {!n.dibaca && (
                  <button
                    type="button"
                    className="mt-2 text-xs text-primary hover:underline"
                    onClick={() => markRead(n.id)}
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
