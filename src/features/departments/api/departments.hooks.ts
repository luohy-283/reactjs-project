import { getDepartments } from "@/features/departments/api/departments.service";
import type { Department } from "@/features/departments/api/departments.types";
import { useAsyncFetch } from "@/lib/useAsyncFetch";

/**
 * @param enabled When false, skip fetch (lazy-load until modal/form opens).
 */
export function useDepartments(enabled = true) {
  return useAsyncFetch((signal) => getDepartments(signal), [], {
    initialData: [] as Department[],
    enabled,
  });
}
