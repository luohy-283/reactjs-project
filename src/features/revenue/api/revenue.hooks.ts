import { useCallback, useEffect, useState } from "react";
import { getMonthlyRevenue } from "@/features/revenue/api/revenue.service";
import type { RevenueReport } from "@/features/revenue/api/revenue.types";
import { isAbortError } from "@/lib/api-error";

export function useMonthlyRevenue(yearMonth: string) {
  const [data, setData] = useState<RevenueReport | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await getMonthlyRevenue(yearMonth));
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [yearMonth]);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const report = await getMonthlyRevenue(yearMonth, controller.signal);
        if (!controller.signal.aborted) setData(report);
      } catch (err) {
        if (!controller.signal.aborted && !isAbortError(err)) setError(err);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();
    return () => controller.abort();
  }, [yearMonth]);

  return { data, error, isLoading, refetch };
}
