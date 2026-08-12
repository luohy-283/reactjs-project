import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

/** `DD/MM/YYYY HH:mm – HH:mm` for booking/invoice ranges. */
export function formatDateTimeRange(startTime: string, endTime: string): string {
  return `${dayjs(startTime).format("DD/MM/YYYY HH:mm")} – ${dayjs(endTime).format("HH:mm")}`;
}

/**
 * Wire wall-clock local time to API `date-time`.
 * Prefer offset (`…+07:00`) over `toISOString()` UTC (`…Z`) so the payload
 * matches what the user picked and LocalDateTime BEs do not shift hours.
 */
export function toApiDateTime(value: Dayjs): string {
  return value.format("YYYY-MM-DDTHH:mm:ssZ");
}
