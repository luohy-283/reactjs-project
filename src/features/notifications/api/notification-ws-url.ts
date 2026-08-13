/**
 * Resolve STOMP WebSocket URL from the same base as REST API.
 * `http://host:8080/api` → `ws://host:8080/ws`
 * `/api` (Vite proxy) → `ws://${location.host}/ws`
 */
export function resolveNotificationWsUrl(): string {
  const apiBase =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

  if (apiBase.startsWith("/")) {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}/ws`;
  }

  try {
    const url = new URL(apiBase);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/ws";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "ws://localhost:8080/ws";
  }
}
