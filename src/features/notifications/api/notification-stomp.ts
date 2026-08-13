import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { AUTH_TOKEN_KEY } from "@/lib/auth-storage";
import { resolveNotificationWsUrl } from "@/features/notifications/api/notification-ws-url";

export type NotificationPushHandler = (raw: unknown) => void;

/**
 * STOMP client for `/user/queue/notifications`.
 * JWT on CONNECT; reconnect → caller should REST-refetch.
 */
export function createNotificationStompClient(options: {
  onMessage: NotificationPushHandler;
  onConnected?: () => void;
  onDisconnected?: () => void;
}): Client {
  const client = new Client({
    brokerURL: resolveNotificationWsUrl(),
    reconnectDelay: 5_000,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
    beforeConnect: () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      client.connectHeaders = token
        ? { Authorization: `Bearer ${token}` }
        : {};
    },
    onConnect: () => {
      options.onConnected?.();
      client.subscribe("/user/queue/notifications", (message: IMessage) => {
        if (!message.body) return;
        try {
          options.onMessage(JSON.parse(message.body) as unknown);
        } catch {
          // ignore malformed push
        }
      });
    },
    onDisconnect: () => {
      options.onDisconnected?.();
    },
    onStompError: () => {
      options.onDisconnected?.();
    },
    onWebSocketClose: () => {
      options.onDisconnected?.();
    },
  });

  return client;
}

export type { StompSubscription };
