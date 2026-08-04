import {
  getDepartmentChangeRequests,
  getUsersPage,
} from "@/features/users/api/users.service";
import type { GetUsersOptions } from "@/features/users/api/users.service";
import type {
  DepartmentChangeRequest,
  ManagedUser,
} from "@/features/users/api/users.types";
import type { PagedResult } from "@/lib/pagination";
import { useAsyncFetch } from "@/lib/useAsyncFetch";

const EMPTY_USERS_PAGE: PagedResult<ManagedUser> = {
  items: [],
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
};

export function useUsersPage(
  options: Omit<GetUsersOptions, "signal">,
  enabled = true,
) {
  return useAsyncFetch(
    (signal) => getUsersPage({ ...options, signal }),
    [options.page, options.size, options.sort, options.q, options.activated],
    { initialData: EMPTY_USERS_PAGE, enabled },
  );
}

export function usePendingDepartmentChanges() {
  return useAsyncFetch(
    (signal) => getDepartmentChangeRequests("PENDING", signal),
    [],
    { initialData: [] as DepartmentChangeRequest[] },
  );
}
