import { useCallback, useEffect, useState } from "react";
import { getMyInvoices } from "@/features/invoices/api/invoices.service";
import type { Booking } from "@/features/bookings/api/bookings.types";
import { isAbortError } from "@/lib/api-error";

export function useMyInvoices() {
  const [data, setData] = useState<Booking[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await getMyInvoices());
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
        const items = await getMyInvoices(controller.signal);
        if (!controller.signal.aborted) setData(items);
      } catch (err) {
        if (!controller.signal.aborted && !isAbortError(err)) setError(err);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  return { data, error, isLoading, refetch };
}
