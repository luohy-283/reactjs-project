import { getBookings, getBookingsPage } from "@/features/bookings/api/bookings.service";
import type { GetBookingsOptions } from "@/features/bookings/api/bookings.service";
import type { Booking } from "@/features/bookings/api/bookings.types";
import type { PagedResult } from "@/lib/pagination";
import { useAsyncFetch } from "@/lib/useAsyncFetch";

export function useBookings() {
  return useAsyncFetch((signal) => getBookings(undefined, signal), [], {
    initialData: [] as Booking[],
  });
}

const EMPTY_PAGE: PagedResult<Booking> = {
  items: [],
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
};

export function useBookingsPage(
  options: Omit<GetBookingsOptions, "signal">,
  enabled = true,
) {
  return useAsyncFetch(
    (signal) => getBookingsPage({ ...options, signal }),
    [
      options.page,
      options.size,
      options.sort,
      options.status,
      options.date,
      options.q,
      options.upcoming,
    ],
    { initialData: EMPTY_PAGE, enabled },
  );
}
