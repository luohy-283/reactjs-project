import { apiClient } from "@/lib/api-client";
import { isAbortError, toApiError } from "@/lib/api-error";
import {
  type PagedResult,
  type SpringPageResponse,
  toPagedResult,
} from "@/lib/pagination";
import type { AppNotification } from "@/features/notifications/api/notifications.types";

interface BackendNotification {
  id: number;
  type: AppNotification["type"];
  title: string;
  message: string;
  /** Local BE */
  bookingId?: number;
  /** Remote BE deep-link id (BOOKING / DEPARTMENT_CHANGE_REQUEST) */
  referenceId?: number;
  referenceType?: string;
  readDate?: string | null;
  readAt?: string | null;
  createdDate?: string;
  createdAt?: string;
  read?: boolean;
}

function toNotification(n: BackendNotification): AppNotification {
  const readAt = n.readDate ?? n.readAt ?? null;
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    bookingId: n.bookingId ?? n.referenceId,
    readDate: readAt,
    createdDate: n.createdDate ?? n.createdAt,
    read: n.read ?? Boolean(readAt),
  };
}

export async function getNotifications(
  signal?: AbortSignal,
): Promise<PagedResult<AppNotification>> {
  try {
    // Remote entity sorts by `createdAt`; `createdDate` causes Spring 500.
    const { data } = await apiClient.get<
      BackendNotification[] | SpringPageResponse<BackendNotification>
    >("/notifications", {
      params: { page: 0, size: 20, sort: "createdAt,desc" },
      signal,
    });
    return toPagedResult(data, toNotification);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được thông báo");
  }
}

function parseUnreadCount(data: unknown): number {
  if (typeof data === "number" && Number.isFinite(data)) return data;
  if (data && typeof data === "object") {
    const obj = data as { count?: unknown; unreadCount?: unknown };
    const n = obj.count ?? obj.unreadCount;
    if (typeof n === "number" && Number.isFinite(n)) return n;
    if (typeof n === "string" && n.trim() !== "" && Number.isFinite(Number(n))) {
      return Number(n);
    }
  }
  return 0;
}

export async function getUnreadNotificationCount(
  signal?: AbortSignal,
): Promise<number> {
  try {
    const { data } = await apiClient.get<unknown>("/notifications/unread-count", {
      signal,
    });
    return parseUnreadCount(data);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được số thông báo");
  }
}

export async function markNotificationRead(id: number): Promise<AppNotification> {
  try {
    const { data } = await apiClient.post<BackendNotification>(
      `/notifications/${id}/read`,
    );
    return toNotification(data);
  } catch (error) {
    throw toApiError(error, "Không đánh dấu đã đọc");
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  try {
    await apiClient.post("/notifications/read-all");
  } catch (error) {
    throw toApiError(error, "Không đánh dấu đã đọc tất cả");
  }
}
