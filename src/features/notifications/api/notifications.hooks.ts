import { useCallback, useEffect, useState } from "react";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notifications/api/notifications.service";
import type { AppNotification } from "@/features/notifications/api/notifications.types";
import { isAbortError } from "@/lib/api-error";

const POLL_MS = 15_000;

export function useNotifications(enabled: boolean) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(enabled);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const [page, count] = await Promise.all([
      getNotifications(signal),
      getUnreadNotificationCount(signal),
    ]);
    if (signal?.aborted) return;
    setItems(page.items);
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await refresh(controller.signal);
      } catch (err) {
        if (!cancelled && !isAbortError(err)) setError(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    const timer = window.setInterval(() => {
      void refresh().catch((err) => {
        if (!isAbortError(err)) setError(err);
      });
    }, POLL_MS);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(timer);
    };
  }, [enabled, refresh]);

  const markRead = useCallback(async (id: number) => {
    const wasUnread = items.some((n) => n.id === id && !n.read);
    const updated = await markNotificationRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? updated : n)));
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
  }, [items]);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setItems((prev) =>
      prev.map((n) => ({
        ...n,
        read: true,
        readDate: n.readDate ?? new Date().toISOString(),
      })),
    );
    setUnreadCount(0);
  }, []);

  return {
    items,
    unreadCount,
    error,
    isLoading,
    refresh: () => refresh(),
    markRead,
    markAllRead,
  };
}
