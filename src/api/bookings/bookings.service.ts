import { mockCreateBooking, mockGetBookings } from "../../lib/mockApi";
import type { Booking, CreateBookingPayload } from "./bookings.types";

export async function getBookings(date: string): Promise<Booking[]> {
  return mockGetBookings(date);
}

export async function createBooking(
  payload: CreateBookingPayload,
): Promise<Booking> {
  return mockCreateBooking(payload);
}
