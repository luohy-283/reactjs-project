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
import type { Booking, BookingStatus, CreateBookingPayload } from "@/lib/types/booking";

export interface GetBookingsOptions extends PageParams {
  date?: string;
  status?: BookingStatus;
  /** Text search: title, room name, user login/email/fullName */
  q?: string;
  /** APPROVED bookings with startTime after now */
  upcoming?: boolean;
  signal?: AbortSignal;
}

function buildQueryParams(options: GetBookingsOptions) {
  const params: Record<string, string | number | boolean> = {};
  if (options.date) params.date = options.date;
  if (options.status) params.status = options.status;
  if (options.q?.trim()) params.q = options.q.trim();
  if (options.upcoming) params.upcoming = true;
  if (options.page != null) params.page = options.page;
  if (options.size != null) params.size = options.size;
  if (options.sort) params.sort = options.sort;
  return Object.keys(params).length > 0 ? params : undefined;
}

/** Paginated list — Admin history table. */
export async function getBookingsPage(
  options: GetBookingsOptions = {},
): Promise<PagedResult<Booking>> {
  const { signal, ...query } = options;
  try {
    const { data } = await apiClient.get<
      | BackendBookingDto[]
      | BackendBookingDto
      | SpringPageResponse<BackendBookingDto>
    >("/bookings", {
      params: buildQueryParams(query),
      signal,
    });
    return toPagedResult(data, mapBackendBooking);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được lịch đặt");
  }
}

/** Tab badge totals — BE has no /bookings/count; reuse page API and read totalElements. */
export type GetBookingsCountOptions = Omit<
  GetBookingsOptions,
  "page" | "size" | "sort"
>;

export async function getBookingsCount(
  options: GetBookingsCountOptions = {},
): Promise<number> {
  const page = await getBookingsPage({ ...options, page: 0, size: 1 });
  return page.totalElements;
}

/** Full list for schedule — request a large size (same bound as getRooms). */
export async function getBookings(
  date?: string,
  signal?: AbortSignal,
): Promise<Booking[]> {
  const result = await getBookingsPage({ date, signal, page: 0, size: 200 });
  return result.items;
}

export async function createBooking(
  payload: CreateBookingPayload,
): Promise<Booking> {
  const body = {
    title: payload.title,
    startTime: payload.startTime,
    endTime: payload.endTime,
    roomId: payload.roomId,
  };
  try {
    const { data } = await apiClient.post<BackendBookingDto>("/bookings", body);
    return mapBackendBooking(data);
  } catch (error) {
    throw toApiError(error, "Không đặt được phòng");
  }
}

/** Remote Swagger: POST /api/bookings/{id}/approve|reject|cancel (no /admin/bookings). */
async function postBookingAction(
  id: number,
  action: "approve" | "reject" | "cancel",
  errorMessage: string,
): Promise<Booking> {
  try {
    const { data } = await apiClient.post<BackendBookingDto>(
      `/bookings/${id}/${action}`,
    );
    return mapBackendBooking(data);
  } catch (error) {
    throw toApiError(error, errorMessage);
  }
}

export async function getBooking(id: number, signal?: AbortSignal): Promise<Booking> {
  try {
    const { data } = await apiClient.get<BackendBookingDto>(`/bookings/${id}`, {
      signal,
    });
    return mapBackendBooking(data);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được lịch đặt");
  }
}

export async function approveBooking(id: number): Promise<Booking> {
  return postBookingAction(id, "approve", "Không duyệt được yêu cầu");
}

export async function rejectBooking(id: number): Promise<Booking> {
  return postBookingAction(id, "reject", "Không từ chối được yêu cầu");
}

export async function cancelBooking(id: number): Promise<Booking> {
  return postBookingAction(id, "cancel", "Không hủy được lịch đặt");
}
