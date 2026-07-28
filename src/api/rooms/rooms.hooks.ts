import { useCallback, useEffect, useState } from "react";
import { getRooms, getRoomsPage } from "./rooms.service";
import { isAbortError } from "../../lib/api-error";
import type { Room } from "./rooms.types";

const DEFAULT_PAGE_SIZE = 10;

/** Server-side pagination — Admin rooms table. */
export function usePaginatedRooms(pageSize = DEFAULT_PAGE_SIZE) {
  const [data, setData] = useState<Room[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPage = useCallback(
    async (targetPage: number, signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getRoomsPage({
          page: targetPage,
          size: pageSize,
          signal,
        });
        if (!signal?.aborted) {
          setData(result.items);
          setPage(result.page);
          setTotal(result.totalElements);
        }
      } catch (err) {
        if (!signal?.aborted && !isAbortError(err)) {
          setError(err);
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [pageSize],
  );

  const refetch = useCallback(async () => {
    await fetchPage(page);
  }, [fetchPage, page]);

  const onPageChange = useCallback(
    (nextPage: number, nextPageSize: number) => {
      void fetchPage(nextPage - 1);
      if (nextPageSize !== pageSize) {
        setPage(0);
      }
    },
    [fetchPage, pageSize],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchPage(0, controller.signal);
    return () => controller.abort();
  }, [fetchPage]);

  return {
    data,
    page: page + 1,
    pageSize,
    total,
    error,
    isLoading,
    refetch,
    onPageChange,
  };
}

/** Full list — Dashboard. */
export function useRooms() {
  const [data, setData] = useState<Room[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await getRooms());
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const rooms = await getRooms(controller.signal);
        if (!controller.signal.aborted) {
          setData(rooms);
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
  }, []);

  return { data, error, isLoading, refetch };
}
