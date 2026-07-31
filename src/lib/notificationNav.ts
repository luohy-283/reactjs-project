const FLASH_KEY = "notificationFlash" as const;

/** Read flash nonce from react-router location.state (notification deep-link). */
export function parseNotificationFlash(state: unknown): number | undefined {
  if (state && typeof state === "object" && FLASH_KEY in state) {
    const value = (state as { notificationFlash?: unknown }).notificationFlash;
    return typeof value === "number" ? value : undefined;
  }
  return undefined;
}

/** Merge a new flash nonce into navigate() state so highlight re-runs. */
export function withNotificationFlash(
  state: unknown,
): Record<string, unknown> {
  const base =
    state && typeof state === "object"
      ? { ...(state as Record<string, unknown>) }
      : {};
  return { ...base, [FLASH_KEY]: Date.now() };
}
