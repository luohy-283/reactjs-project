import { apiClient } from "@/lib/api-client";
import { isAbortError, toApiError } from "@/lib/api-error";
import type { Department } from "@/features/departments/api/departments.types";
import { toItems } from "@/lib/pagination";

export async function getDepartments(
  signal?: AbortSignal,
): Promise<Department[]> {
  try {
    // Remote BE `/departments/user` returns one object; local may return a list.
    const { data } = await apiClient.get<Department | Department[]>(
      "/departments/user",
      { signal },
    );
    return toItems(data, (d) => d);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được danh sách phòng ban");
  }
}
