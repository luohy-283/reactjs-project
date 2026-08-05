import { apiClient } from "@/lib/api-client";
import { isAbortError, toApiError } from "@/lib/api-error";
import {
  type PageParams,
  type PagedResult,
  type SpringPageResponse,
  toPagedResult,
} from "@/lib/pagination";
import {
  mapBackendBooking,
  type BackendBookingDto,
} from "@/lib/mapBackendBooking";
import type { Booking } from "@/lib/types/booking";

export interface GetMyInvoicesOptions extends PageParams {
  /** Search title / room name */
  q?: string;
  signal?: AbortSignal;
}

export async function getMyInvoicesPage(
  options: GetMyInvoicesOptions = {},
): Promise<PagedResult<Booking>> {
  const { signal, page = 0, size = 10, sort, q } = options;
  try {
    const { data } = await apiClient.get<
      BackendBookingDto[] | SpringPageResponse<BackendBookingDto>
    >("/account/invoices", {
      params: {
        page,
        size,
        ...(sort ? { sort } : {}),
        ...(q?.trim() ? { q: q.trim() } : {}),
      },
      signal,
    });
    return toPagedResult(data, mapBackendBooking);
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
    const { data } = await apiClient.get<BackendBookingDto>(
      `/account/invoices/${id}`,
      { signal },
    );
    return mapBackendBooking(data);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được hóa đơn");
  }
}
