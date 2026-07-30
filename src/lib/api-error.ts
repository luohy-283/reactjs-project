import axios from "axios";

type ProblemBody = {
  title?: string;
  detail?: string;
  message?: string;
  params?: string;
};

const GENERIC_TITLES = new Set([
  "Bad Request",
  "Not Found",
  "Unauthorized",
  "Forbidden",
  "Internal Server Error",
  "Conflict",
]);

/** Map known BE error keys to Vietnamese copy when title was stripped. */
const ERROR_KEY_MESSAGES: Record<string, string> = {
  "error.hasbookings":
    "Không thể vô hiệu hóa phòng đang có lịch đặt (chờ duyệt hoặc đã duyệt chưa kết thúc)",
  "error.overlap": "Phòng đã được đặt trong khoảng thời gian này",
  "error.alreadystarted": "Không thể hủy lịch đã bắt đầu hoặc đã qua",
  "error.invalidstatus": "Trạng thái lịch đặt không hợp lệ cho thao tác này",
};

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ProblemBody | undefined;
    const key = data?.message;
    if (key && ERROR_KEY_MESSAGES[key]) {
      return ERROR_KEY_MESSAGES[key];
    }

    const title = data?.title?.trim();
    if (title && !GENERIC_TITLES.has(title)) {
      return title;
    }

    const detail = data?.detail?.trim();
    if (detail && !detail.startsWith("400 BAD_REQUEST") && !GENERIC_TITLES.has(detail)) {
      return detail;
    }

    if (typeof data?.message === "string" && data.message && !data.message.startsWith("error.")) {
      return data.message;
    }

    return fallback;
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
