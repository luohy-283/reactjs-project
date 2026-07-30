import { apiClient } from "@/lib/api-client";
import { isAbortError, toApiError } from "@/lib/api-error";
import {
  type PageParams,
  type PagedResult,
  type SpringPageResponse,
  toPagedResult,
} from "@/lib/pagination";
import type { Booking } from "@/features/bookings/api/bookings.types";

interface BackendInvoice {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  status: Booking["status"];
  pricePerHour?: number;
  amount?: number;
  room?: { id: number; name?: string; pricePerHour?: number };
  user?: { id: number; login?: string };
}

function toInvoice(booking: BackendInvoice): Booking {
  return {
    id: booking.id,
    roomId: booking.room?.id ?? 0,
    userId: booking.user?.id ?? 0,
    title: booking.title,
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
    roomName: booking.room?.name,
    userLogin: booking.user?.login,
    pricePerHour:
      booking.pricePerHour != null
        ? Number(booking.pricePerHour)
        : booking.room?.pricePerHour != null
          ? Number(booking.room.pricePerHour)
          : undefined,
    amount: booking.amount != null ? Number(booking.amount) : undefined,
  };
}

export async function getMyInvoicesPage(
  options: PageParams & { signal?: AbortSignal } = {},
): Promise<PagedResult<Booking>> {
  const { signal, page = 0, size = 50, sort = "startTime,desc" } = options;
  try {
    const { data } = await apiClient.get<
      BackendInvoice[] | SpringPageResponse<BackendInvoice>
    >("/account/invoices", {
      params: { page, size, sort },
      signal,
    });
    return toPagedResult(data, toInvoice);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được hóa đơn");
  }
}

export async function getMyInvoices(
  signal?: AbortSignal,
): Promise<Booking[]> {
  const result = await getMyInvoicesPage({ signal, page: 0, size: 200 });
  return result.items;
}

export async function getMyInvoice(
  id: number,
  signal?: AbortSignal,
): Promise<Booking> {
  try {
    const { data } = await apiClient.get<BackendInvoice>(
      `/account/invoices/${id}`,
      { signal },
    );
    return toInvoice(data);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được chi tiết hóa đơn");
  }
}
