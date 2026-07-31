import {
  getMyInvoices,
  getMyInvoicesPage,
  type GetMyInvoicesOptions,
} from "@/features/invoices/api/invoices.service";
import type { Booking } from "@/features/bookings/api/bookings.types";
import type { PagedResult } from "@/lib/pagination";
import { useAsyncFetch } from "@/lib/useAsyncFetch";

export function useMyInvoices() {
  return useAsyncFetch((signal) => getMyInvoices(signal), [], {
    initialData: [] as Booking[],
  });
}

const EMPTY_INVOICES_PAGE: PagedResult<Booking> = {
  items: [],
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
};

export function useMyInvoicesPage(
  options: Omit<GetMyInvoicesOptions, "signal">,
) {
  return useAsyncFetch(
    (signal) => getMyInvoicesPage({ ...options, signal }),
    [options.page, options.size, options.sort, options.q],
    { initialData: EMPTY_INVOICES_PAGE },
  );
}
