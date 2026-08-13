import { useCallback, useEffect, useRef, useState } from "react";
import type { Client } from "@stomp/stompjs";
import { createNotificationStompClient } from "@/features/notifications/api/notification-stomp";
import {
  getNotifications,
  getUnreadNotificationCount,
  mapNotificationPayload,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notifications/api/notifications.service";
import type { AppNotification } from "@/features/notifications/api/notifications.types";
import { isAbortError } from "@/lib/api-error";
import { onNotificationsChanged } from "@/lib/notification-events";

export function useNotifications(enabled: boolean) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [marking, setMarking] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const mutationInFlightRef = useRef<boolean>(false);
  const stompRef = useRef<Client | null>(null);

  const runRefresh = useCallback(async (opts?: { showLoading?: boolean }) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    if (opts?.showLoading) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const page = await getNotifications(controller.signal);
      let count = page.items.filter((n) => !n.read).length;
      try {
        count = await getUnreadNotificationCount(controller.signal);
      } catch (countErr) {
        if (isAbortError(countErr)) {
          /* aborted */
        }
      }
      if (!controller.signal.aborted && !mutationInFlightRef.current) {
        setItems(page.items);
        setUnreadCount(count);
      }
    } catch (err) {
      if (!controller.signal.aborted && !isAbortError(err)) setError(err);
    } finally {
      if (opts?.showLoading && !controller.signal.aborted) setIsLoading(false);
    }
  }, []);

  const applyPush = useCallback((raw: unknown) => {
    const mapped = mapNotificationPayload(raw);
    if (!mapped) return;
    setItems((prev) => {
      const existing = prev.find((n) => n.id === mapped.id);
      if (existing) {
        return prev.map((n) => (n.id === mapped.id ? mapped : n));
      }
      if (!mapped.read) {
        setUnreadCount((c) => c + 1);
      }
      return [mapped, ...prev].slice(0, 20);
    });
  }, []);

  useEffect(() => {
    if (!enabled) {
      controllerRef.current?.abort();
      stompRef.current?.deactivate();
      stompRef.current = null;
      setTimeout(() => {
        setIsLoading(false);
      }, 0);
      return;
    }

    setTimeout(() => {
      void runRefresh({ showLoading: true });
    }, 0);

    const client = createNotificationStompClient({
      onMessage: applyPush,
      onConnected: () => {
        void runRefresh();
      },
    });
    stompRef.current = client;
    client.activate();

    const unsub = onNotificationsChanged(() => {
      void runRefresh();
    });

    return () => {
      controllerRef.current?.abort();
      unsub();
      client.deactivate();
      if (stompRef.current === client) {
        stompRef.current = null;
      }
    };
  }, [enabled, runRefresh, applyPush]);

  const markRead = useCallback(
    async (id: number) => {
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
    },
    [items, runRefresh],
  );

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
