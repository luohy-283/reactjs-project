import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

/** `DD/MM/YYYY HH:mm – HH:mm` for booking/invoice ranges. */
export function formatDateTimeRange(startTime: string, endTime: string): string {
  return `${dayjs(startTime).format("DD/MM/YYYY HH:mm")} – ${dayjs(endTime).format("HH:mm")}`;
}

/**
 * Wire wall-clock local time for remote BE `LocalDateTime`
 * (no offset / `Z` — those cause DateTimeParseException).
 */
export function toApiDateTime(value: Dayjs): string {
  return value.format("YYYY-MM-DDTHH:mm:ss");
}
