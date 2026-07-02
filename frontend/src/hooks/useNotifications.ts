import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { notificationsApi, type Notification } from '@/lib/notifications-api';
import { useAuth } from '@/hooks/useAuth';

export function useNotifications() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [isLoading, setIsLoading]         = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchAll = useCallback(async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const data = await notificationsApi.getAll();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.dibaca).length);
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (!profile) return;

    fetchAll();

    // Supabase Realtime: subscribe INSERT pada tabel notifications untuk user ini
    const channel = supabase
      .channel(`notifications:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const incoming = payload.new as Notification;
          setNotifications((prev) => [incoming, ...prev]);
          setUnreadCount((prev) => prev + 1);
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [profile, fetchAll]);

  const markRead = useCallback(async (id: string) => {
    await notificationsApi.markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, dibaca: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, dibaca: true })));
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, isLoading, markRead, markAllRead, refetch: fetchAll };
}
