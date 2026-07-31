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
  fetcherRef.current = fetcher;

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await fetcherRef.current(new AbortController().signal));
    } catch (err) {
      if (!isAbortError(err)) setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    void (async () => {
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
    })();

    return () => controller.abort();
    // Caller supplies the dependency list for when to re-fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  return { data, error, isLoading, refetch };
}
