import { isAxiosError, type AxiosError } from "axios";
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
} from "@/features/bookings/api/mapBackendBooking";
import type { Booking, BookingStatus, CreateBookingPayload } from "@/features/bookings/api/bookings.types";

export interface GetBookingsOptions extends PageParams {
  date?: string;
  status?: BookingStatus;
  /** Text search: title, room name, user login/email/fullName */
  q?: string;
  /** APPROVED bookings with startTime after now */
  upcoming?: boolean;
  signal?: AbortSignal;
}

function isMissingAdminRoute(error: unknown): error is AxiosError {
  if (!isAxiosError(error)) return false;
  // Only fall back when the /api/admin/bookings route does not exist.
  // Do not swallow 500s (or other business errors) as "missing route".
  return error.response?.status === 404;
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
    room: { id: payload.roomId },
  };
  try {
    const { data } = await apiClient.post<BackendBookingDto>("/bookings", body);
    return mapBackendBooking(data);
  } catch (error) {
    throw toApiError(error, "Không đặt được phòng");
  }
}

async function postBookingAction(
  id: number,
  action: "approve" | "reject" | "cancel",
  errorMessage: string,
): Promise<Booking> {
  try {
    try {
      const { data } = await apiClient.post<BackendBookingDto>(
        `/admin/bookings/${id}/${action}`,
      );
      return mapBackendBooking(data);
    } catch (error) {
      if (!isMissingAdminRoute(error)) throw error;
      const { data } = await apiClient.post<BackendBookingDto>(
        `/bookings/${id}/${action}`,
      );
      return mapBackendBooking(data);
    }
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
