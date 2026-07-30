import { useCallback, useEffect, useState } from "react";
import { getBookings } from "@/features/bookings/api/bookings.service";
import { isAbortError } from "@/lib/api-error";
import type { Booking } from "@/features/bookings/api/bookings.types";

export function useBookings() {
  const [data, setData] = useState<Booking[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await getBookings());
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
        const bookings = await getBookings(undefined, controller.signal);
        if (!controller.signal.aborted) {
          setData(bookings);
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
