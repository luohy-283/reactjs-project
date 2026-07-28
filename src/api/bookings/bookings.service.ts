import { isAxiosError, type AxiosError } from "axios";
import { apiClient } from "../../lib/api-client";
import { isAbortError, toApiError } from "../../lib/api-error";
import type { Booking, CreateBookingPayload } from "./bookings.types";

interface BackendBooking {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  status: Booking["status"];
  /** Flat remote DTO */
  roomId?: number;
  userId?: number;
  roomName?: string;
  userLogin?: string;
  userEmail?: string;
  userFullName?: string;
  /** Nested JHipster DTO */
  room?: { id: number; name?: string };
  user?: { id: number; login?: string; email?: string };
}

function asArray<T>(data: T[] | T | null | undefined): T[] {
  if (Array.isArray(data)) return data;
  if (data == null) return [];
  return [data];
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

/** Local JHipster may not expose `/admin/*` (404/500). */
function isMissingAdminRoute(error: unknown): error is AxiosError {
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 404 || status === 500;
}

/** Shared list/create — USER + ADMIN. */
export async function getBookings(
  date?: string,
  signal?: AbortSignal,
): Promise<Booking[]> {
  try {
    const { data } = await apiClient.get<BackendBooking[] | BackendBooking>(
      "/bookings",
      {
        params: date ? { date } : undefined,
        signal,
      },
    );
    return asArray(data).map(toBooking);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được lịch đặt");
  }
}

/** Shared create — USER + ADMIN. */
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

/** ADMIN only — duyệt / từ chối / hủy lịch. */
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
