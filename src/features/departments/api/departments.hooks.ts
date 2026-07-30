import { useCallback, useEffect, useState } from "react";
import { getDepartments } from "@/features/departments/api/departments.service";
import type { Department } from "@/features/departments/api/departments.types";
import { isAbortError } from "@/lib/api-error";

/**
 * @param enabled When false, skip fetch (lazy-load until modal/form opens).
 */
export function useDepartments(enabled = true) {
  const [data, setData] = useState<Department[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(enabled);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await getDepartments());
    } catch (err) {
      setError(err);
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
        const items = await getDepartments(controller.signal);
        if (!controller.signal.aborted) {
          setData(items);
        }
      } catch (err) {
        if (!controller.signal.aborted && !isAbortError(err)) {
          setError(err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [enabled]);

  return { data, error, isLoading, refetch };
}
