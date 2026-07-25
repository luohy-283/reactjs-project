import { apiClient } from "../../lib/api-client";
import { isAbortError, toApiError } from "../../lib/api-error";
import type { Booking, CreateBookingPayload } from "./bookings.types";

interface BackendBooking {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  status: Booking["status"];
  room?: { id: number; name?: string };
  user?: { id: number; login?: string };
}

function toBooking(booking: BackendBooking): Booking {
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
  };
}

export async function getBookings(
  date?: string,
  signal?: AbortSignal,
): Promise<Booking[]> {
  try {
    const { data } = await apiClient.get<BackendBooking[]>("/bookings", {
      params: date ? { date } : undefined,
      signal,
    });
    return data.map(toBooking);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được lịch đặt");
  }
}

export async function createBooking(
  payload: CreateBookingPayload,
): Promise<Booking> {
  try {
    const { data } = await apiClient.post<BackendBooking>("/bookings", {
      title: payload.title,
      startTime: payload.startTime,
      endTime: payload.endTime,
      room: { id: payload.roomId },
    });
    return toBooking(data);
  } catch (error) {
    throw toApiError(error, "Không đặt được phòng");
  }
}

export async function approveBooking(id: number): Promise<Booking> {
  try {
    const { data } = await apiClient.post<BackendBooking>(
      `/bookings/${id}/approve`,
    );
    return toBooking(data);
  } catch (error) {
    throw toApiError(error, "Không duyệt được yêu cầu");
  }
}

export async function rejectBooking(id: number): Promise<Booking> {
  try {
    const { data } = await apiClient.post<BackendBooking>(
      `/bookings/${id}/reject`,
    );
    return toBooking(data);
  } catch (error) {
    throw toApiError(error, "Không từ chối được yêu cầu");
  }
}

export async function cancelBooking(id: number): Promise<Booking> {
  try {
    const { data } = await apiClient.post<BackendBooking>(
      `/bookings/${id}/cancel`,
    );
    return toBooking(data);
  } catch (error) {
    throw toApiError(error, "Không hủy được lịch đặt");
  }
}
