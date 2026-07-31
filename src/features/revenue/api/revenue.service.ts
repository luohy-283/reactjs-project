import { apiClient } from "@/lib/api-client";
import { isAbortError, toApiError } from "@/lib/api-error";
import {
  type PageParams,
  type PagedResult,
  type SpringPageResponse,
  toPagedResult,
} from "@/lib/pagination";
import type {
  RevenueByRoom,
  RevenuePeriod,
  RevenueReport,
} from "@/features/revenue/api/revenue.types";

interface BackendRevenuePeriod {
  yearMonth?: string;
  totalAmount?: number | string;
  totalBookings?: number;
  averageAmount?: number | string;
  cancelledCount?: number;
  cancellationRate?: number | string;
}

interface BackendRevenueReport {
  yearMonth: string;
  totalAmount?: number | string;
  totalBookings?: number;
  averageAmount?: number | string;
  cancelledCount?: number;
  cancellationRate?: number | string;
  previous?: BackendRevenuePeriod;
  byRoom?: Array<{
    roomId: number;
    roomName: string;
    bookingCount: number;
    amount: number | string;
    sharePercent?: number | string;
  }>;
  byDay?: Array<{
    date: string;
    bookingCount: number;
    amount: number | string;
  }>;
}

function toPeriod(data: BackendRevenuePeriod | undefined): RevenuePeriod {
  return {
    yearMonth: data?.yearMonth ?? "",
    totalAmount: Number(data?.totalAmount ?? 0),
    totalBookings: data?.totalBookings ?? 0,
    averageAmount: Number(data?.averageAmount ?? 0),
    cancelledCount: data?.cancelledCount ?? 0,
    cancellationRate: Number(data?.cancellationRate ?? 0),
  };
}

function toReport(data: BackendRevenueReport): RevenueReport {
  return {
    yearMonth: data.yearMonth,
    totalAmount: Number(data.totalAmount ?? 0),
    totalBookings: data.totalBookings ?? 0,
    averageAmount: Number(data.averageAmount ?? 0),
    cancelledCount: data.cancelledCount ?? 0,
    cancellationRate: Number(data.cancellationRate ?? 0),
    previous: toPeriod(data.previous),
    byRoom: (data.byRoom ?? []).map(toByRoom),
    byDay: (data.byDay ?? []).map((d) => ({
      date: d.date,
      bookingCount: d.bookingCount,
      amount: Number(d.amount ?? 0),
    })),
  };
}

function toByRoom(r: {
  roomId: number;
  roomName: string;
  bookingCount: number;
  amount: number | string;
  sharePercent?: number | string;
}): RevenueByRoom {
  return {
    roomId: r.roomId,
    roomName: r.roomName,
    bookingCount: r.bookingCount,
    amount: Number(r.amount ?? 0),
    sharePercent: Number(r.sharePercent ?? 0),
  };
}

export async function getMonthlyRevenue(
  yearMonth: string,
  signal?: AbortSignal,
): Promise<RevenueReport> {
  try {
    const { data } = await apiClient.get<BackendRevenueReport>(
      "/admin/revenue",
      { params: { yearMonth }, signal },
    );
    return toReport(data);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được báo cáo doanh thu");
  }
}

export interface GetRevenueByRoomOptions extends PageParams {
  yearMonth: string;
  /** Filter by room name */
  q?: string;
  signal?: AbortSignal;
}

export async function getRevenueByRoomPage(
  options: GetRevenueByRoomOptions,
): Promise<PagedResult<RevenueByRoom>> {
  const {
    yearMonth,
    signal,
    page = 0,
    size = 10,
    sort = "amount,desc",
    q,
  } = options;
  try {
    const { data } = await apiClient.get<
      | BackendRevenueReport["byRoom"]
      | SpringPageResponse<NonNullable<BackendRevenueReport["byRoom"]>[number]>
    >("/admin/revenue/by-room", {
      params: {
        yearMonth,
        page,
        size,
        sort,
        ...(q?.trim() ? { q: q.trim() } : {}),
      },
      signal,
    });
    return toPagedResult(data, toByRoom);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được doanh thu theo phòng");
  }
}
