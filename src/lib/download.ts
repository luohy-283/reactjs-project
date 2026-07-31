import { apiClient } from "@/lib/api-client";
import { isAbortError, toApiError } from "@/lib/api-error";

/** Download a file from an authenticated API path (blob response). */
export async function downloadAuthenticatedFile(
  path: string,
  filename: string,
  params?: Record<string, string | number | undefined>,
): Promise<void> {
  try {
    const { data } = await apiClient.get<Blob>(path, {
      params,
      responseType: "blob",
    });
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được file");
  }
}
