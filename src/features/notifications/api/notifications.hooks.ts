import { useCallback, useEffect, useRef, useState } from "react";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notifications/api/notifications.service";
import type { AppNotification } from "@/features/notifications/api/notifications.types";
import { isAbortError } from "@/lib/api-error";
import { onNotificationsChanged } from "@/lib/notification-events";

const POLL_MS = 300_000;

export function useNotifications(enabled: boolean) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [marking, setMarking] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const mutationInFlightRef = useRef<boolean>(false);

  const runRefresh = useCallback(async (opts?: { showLoading?: boolean }) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    if (opts?.showLoading) {
      setIsLoading(true);
      setError(null);
    }
    try {
      // List is required; unread-count soft-fails (remote BE may 500) → derive from items.
      const page = await getNotifications(controller.signal);
      let count = page.items.filter((n) => !n.read).length;
      try {
        count = await getUnreadNotificationCount(controller.signal);
      } catch (countErr) {
        // Remote unread-count may 500; keep count derived from list `read` flags.
        if (isAbortError(countErr)) {
          /* aborted — outer guard skips setState */
        }
      }
      if (
        !controller.signal.aborted &&
        !mutationInFlightRef.current
      ) {
        setItems(page.items);
        setUnreadCount(count);
      }
    } catch (err) {
      if (!controller.signal.aborted && !isAbortError(err)) setError(err);
    } finally {
      if (opts?.showLoading && !controller.signal.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      controllerRef.current?.abort();
      setTimeout(() => {
        setIsLoading(false);
      }, 0);
      return;
    }

    setTimeout(() => {
      void runRefresh({ showLoading: true });
    }, 0);
    const timer = window.setInterval(() => {
      void runRefresh();
    }, POLL_MS);
    const unsub = onNotificationsChanged(() => {
      void runRefresh();
    });

    return () => {
      controllerRef.current?.abort();
      window.clearInterval(timer);
      unsub();
    };
  }, [enabled, runRefresh]);

  const markRead = useCallback(async (id: number) => {
    if (mutationInFlightRef.current) return;

    mutationInFlightRef.current = true;
    setMarking(true);
    try {
      const wasUnread = items.some((n) => n.id === id && !n.read);
      const updated = await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? updated : n)));
      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
      await runRefresh();
    } finally {
      mutationInFlightRef.current = false;
      setMarking(false);
    }
  }, [items, runRefresh]);

  const markAllRead = useCallback(async () => {
    if (mutationInFlightRef.current) return;

    mutationInFlightRef.current = true;
    setMarking(true);
    try {
      await markAllNotificationsRead();
      setItems((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
          readDate: n.readDate ?? new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
      await runRefresh();
    } finally {
      mutationInFlightRef.current = false;
      setMarking(false);
    }
  }, [runRefresh]);

  return {
    items,
    unreadCount,
    error,
    isLoading,
    marking,
    refresh: () => runRefresh({ showLoading: true }),
    markRead,
    markAllRead,
  };
}
