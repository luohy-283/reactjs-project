type LogoutListener = () => void;

const listeners = new Set<LogoutListener>();

export function onAuthLogout(listener: LogoutListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitAuthLogout(): void {
  listeners.forEach((listener) => listener());
}
