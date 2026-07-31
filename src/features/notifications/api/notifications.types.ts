export type NotificationType =
  | "BOOKING_PENDING"
  | "BOOKING_APPROVED"
  | "BOOKING_REJECTED"
  | "BOOKING_CANCELLED"
  | "BOOKING_EXPIRED"
  | "DEPT_CHANGE_PENDING"
  | "DEPT_CHANGE_APPROVED"
  | "DEPT_CHANGE_REJECTED";

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  bookingId?: number;
  readDate?: string | null;
  createdDate?: string;
  read: boolean;
}
