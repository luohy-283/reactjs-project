import { apiClient } from "@/lib/api-client";
import { isAbortError, toApiError } from "@/lib/api-error";
import type { Department } from "@/features/departments/api/departments.types";

export async function getDepartments(
  signal?: AbortSignal,
): Promise<Department[]> {
  try {
    const { data } = await apiClient.get<Department[]>("/departments", {
      signal,
    });
    return data;
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được danh sách phòng ban");
  }
}
