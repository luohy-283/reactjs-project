import {
  getMyInvoicesPage,
  type GetMyInvoicesOptions,
} from "@/features/invoices/api/invoices.service";
import type { Booking } from "@/lib/types/booking";
import type { PagedResult } from "@/lib/pagination";
import { useAsyncFetch } from "@/lib/useAsyncFetch";

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
    [options.page, options.size, options.sort, options.q, options.paymentStatus],
    { initialData: EMPTY_INVOICES_PAGE },
  );
}
