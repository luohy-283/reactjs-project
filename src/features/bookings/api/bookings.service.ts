import { isAxiosError, type AxiosError } from "axios";
import { apiClient } from "@/lib/api-client";
import { isAbortError, toApiError } from "@/lib/api-error";
import {
  type PageParams,
  type PagedResult,
  type SpringPageResponse,
  toPagedResult,
} from "@/lib/pagination";
import type { Booking, CreateBookingPayload } from "@/features/bookings/api/bookings.types";

interface BackendBooking {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  status: Booking["status"];
  roomId?: number;
  userId?: number;
  roomName?: string;
  userLogin?: string;
  userEmail?: string;
  userFullName?: string;
  room?: { id: number; name?: string };
  user?: { id: number; login?: string; email?: string };
}

export interface GetBookingsOptions extends PageParams {
  date?: string;
  signal?: AbortSignal;
}

function toBooking(booking: BackendBooking): Booking {
  return {
    id: booking.id,
    roomId: booking.roomId ?? booking.room?.id ?? 0,
    userId: booking.userId ?? booking.user?.id ?? 0,
    title: booking.title,
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
    roomName: booking.roomName ?? booking.room?.name,
    userLogin:
      booking.userLogin ??
      booking.userFullName ??
      booking.userEmail ??
      booking.user?.login ??
      booking.user?.email,
  };
}

function isMissingAdminRoute(error: unknown): error is AxiosError {
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 404 || status === 500;
}

function buildQueryParams(options: GetBookingsOptions) {
  const params: Record<string, string | number> = {};
  if (options.date) params.date = options.date;
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
      BackendBooking[] | BackendBooking | SpringPageResponse<BackendBooking>
    >("/bookings", {
      params: buildQueryParams(query),
      signal,
    });
    return toPagedResult(data, toBooking);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được lịch đặt");
  }
}

/** Full list — BE returns all (optional date filter); UI tables paginate client-side. */
export async function getBookings(
  date?: string,
  signal?: AbortSignal,
): Promise<Booking[]> {
  const result = await getBookingsPage({ date, signal });
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
    const { data } = await apiClient.post<BackendBooking>("/bookings", body);
    return toBooking(data);
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
      const { data } = await apiClient.post<BackendBooking>(
        `/admin/bookings/${id}/${action}`,
      );
      return toBooking(data);
    } catch (error) {
      if (!isMissingAdminRoute(error)) throw error;
      const { data } = await apiClient.post<BackendBooking>(
        `/bookings/${id}/${action}`,
      );
      return toBooking(data);
    }
  } catch (error) {
    throw toApiError(error, errorMessage);
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
