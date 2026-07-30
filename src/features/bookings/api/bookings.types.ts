export type BookingStatus = "PENDING" | "APPROVED" | "CANCELLED";

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
}

export interface CreateBookingPayload {
  roomId: number;
  userId: number;
  title: string;
  startTime: string;
  endTime: string;
}
