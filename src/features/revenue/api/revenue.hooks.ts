import {
  getMonthlyRevenue,
  getRevenueByRoomPage,
  type GetRevenueByRoomOptions,
} from "@/features/revenue/api/revenue.service";
import type {
  RevenueByRoom,
  RevenueReport,
} from "@/features/revenue/api/revenue.types";
import type { PagedResult } from "@/lib/pagination";
import { useAsyncFetch } from "@/lib/useAsyncFetch";

export function useMonthlyRevenue(yearMonth: string) {
  return useAsyncFetch(
    (signal) => getMonthlyRevenue(yearMonth, signal),
    [yearMonth],
    { initialData: null as RevenueReport | null },
  );
}

const EMPTY_BY_ROOM_PAGE: PagedResult<RevenueByRoom> = {
  items: [],
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
};

export function useRevenueByRoomPage(
  options: Omit<GetRevenueByRoomOptions, "signal">,
) {
  return useAsyncFetch(
    (signal) => getRevenueByRoomPage({ ...options, signal }),
    [options.yearMonth, options.page, options.size, options.sort, options.q],
    { initialData: EMPTY_BY_ROOM_PAGE },
  );
}
