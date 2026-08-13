import type { PaymentStatus } from "@/lib/types/booking";

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] =
  [
    { value: "UNPAID", label: "Chưa trả" },
    { value: "PAID", label: "Đã trả" },
  ];

export const PAYMENT_COLOR_MAP = {
  UNPAID: "orange",
  PAID: "green",
} as const;

export const PAYMENT_LABEL_MAP = {
  UNPAID: "Chưa trả",
  PAID: "Đã trả",
} as const;
