import type {
  Booking,
  BookingStatus,
  PaymentStatus,
} from "@/lib/types/booking";

/** Shape returned by booking / invoice REST endpoints (flat or nested). */
export interface BackendBookingDto {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  roomId?: number;
  userId?: number;
  roomName?: string;
  userLogin?: string;
  userEmail?: string;
  userFullName?: string;
  pricePerHour?: number | string;
  amount?: number | string;
  paymentStatus?: PaymentStatus;
  approvedByLogin?: string;
  approvedByFullName?: string;
  room?: { id: number; name?: string; pricePerHour?: number | string };
  user?: { id: number; login?: string; email?: string };
}

export function mapBackendBooking(booking: BackendBookingDto): Booking {
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
    pricePerHour:
      booking.pricePerHour != null
        ? Number(booking.pricePerHour)
        : booking.room?.pricePerHour != null
          ? Number(booking.room.pricePerHour)
          : undefined,
    amount: booking.amount != null ? Number(booking.amount) : undefined,
    paymentStatus: booking.paymentStatus,
    approvedByLogin: booking.approvedByLogin,
    approvedByFullName: booking.approvedByFullName,
  };
}
