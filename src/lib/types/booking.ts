export type BookingStatus = "PENDING" | "APPROVED" | "CANCELLED" | "EXPIRED";

export interface Booking {
  id: number;
  roomId: number;
  userId: number;
  title: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  /** Display helpers from nested JHipster DTO */
  roomName?: string;
  userLogin?: string;
  pricePerHour?: number;
  amount?: number;
}

export interface CreateBookingPayload {
  roomId: number;
  userId: number;
  title: string;
  startTime: string;
  endTime: string;
}
