import { useCallback, useEffect, useState } from "react";
import { getRooms } from "@/features/rooms/api/rooms.service";
import { isAbortError } from "@/lib/api-error";
import type { Room } from "@/features/rooms/api/rooms.types";

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
