import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DependencyList,
} from "react";
import { isAbortError } from "@/lib/api-error";

type AsyncFetcher<T> = (signal: AbortSignal) => Promise<T>;

/**
 * Shared abort-safe fetch: loading/error/data + refetch.
 * Re-runs when `deps` change; set `enabled: false` to skip until ready.
 * Effect and refetch share one AbortController — new work aborts in-flight.
 */
export function useAsyncFetch<T>(
  fetcher: AsyncFetcher<T>,
  deps: DependencyList,
  options: { initialData: T; enabled?: boolean },
): {
  data: T;
  error: unknown;
  isLoading: boolean;
  refetch: () => Promise<void>;
} {
  const { initialData, enabled = true } = options;
  const [data, setData] = useState<T>(initialData);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const fetcherRef = useRef(fetcher);
  const controllerRef = useRef<AbortController | null>(null);

  // Keep latest fetcher without listing it in runFetch deps (avoids fetch loops).
  // Do not assign ref.current during render — eslint-plugin-react-hooks / React 19 forbid it.
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const runFetch = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current(controller.signal);
      if (!controller.signal.aborted) setData(result);
    } catch (err) {
      if (!controller.signal.aborted && !isAbortError(err)) setError(err);
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      controllerRef.current?.abort();
      return;
    }

    // Defer so loading/data setState is not synchronous in the effect body
    // (eslint-plugin-react-hooks `set-state-in-effect`).
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void runFetch();
    });
    return () => {
      cancelled = true;
      controllerRef.current?.abort();
    };
    // Caller supplies the dependency list for when to re-fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, runFetch, ...deps]);

  return {
    data,
    error,
    isLoading: enabled && isLoading,
    refetch: runFetch,
  };
}
