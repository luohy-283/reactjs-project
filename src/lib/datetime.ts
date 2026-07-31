import dayjs from "dayjs";

/** `DD/MM/YYYY HH:mm – HH:mm` for booking/invoice ranges. */
export function formatDateTimeRange(startTime: string, endTime: string): string {
  return `${dayjs(startTime).format("DD/MM/YYYY HH:mm")} – ${dayjs(endTime).format("HH:mm")}`;
}
