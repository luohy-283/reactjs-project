type NotificationsChangedListener = () => void;

const listeners = new Set<NotificationsChangedListener>();

/** Subscribe to inbox invalidation (approve/reject cleared pending notices, etc.). */
export function onNotificationsChanged(
  listener: NotificationsChangedListener,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Ask the topbar bell to refetch list + unread count. */
export function emitNotificationsChanged(): void {
  listeners.forEach((listener) => listener());
}
