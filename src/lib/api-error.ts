import axios from "axios";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { title?: string; detail?: string; message?: string }
      | undefined;
    return data?.title || data?.detail || data?.message || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

/** Wrap API failures while preserving the original error as `cause`. */
export function toApiError(error: unknown, fallback: string): Error {
  return new Error(getApiErrorMessage(error, fallback), { cause: error });
}

export function isAbortError(error: unknown): boolean {
  return axios.isCancel(error) || (axios.isAxiosError(error) && error.code === "ERR_CANCELED");
}
