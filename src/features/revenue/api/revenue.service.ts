import { apiClient } from "@/lib/api-client";
import { isAbortError, toApiError } from "@/lib/api-error";
import type {
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
    byRoom: (data.byRoom ?? []).map((r) => ({
      roomId: r.roomId,
      roomName: r.roomName,
      bookingCount: r.bookingCount,
      amount: Number(r.amount ?? 0),
      sharePercent: Number(r.sharePercent ?? 0),
    })),
    byDay: (data.byDay ?? []).map((d) => ({
      date: d.date,
      bookingCount: d.bookingCount,
      amount: Number(d.amount ?? 0),
    })),
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
