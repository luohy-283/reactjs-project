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
  bookingId?: number;
  readDate?: string | null;
  createdDate?: string;
  read?: boolean;
}

function toNotification(n: BackendNotification): AppNotification {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    bookingId: n.bookingId,
    readDate: n.readDate,
    createdDate: n.createdDate,
    read: n.read ?? Boolean(n.readDate),
  };
}

export async function getNotifications(
  signal?: AbortSignal,
): Promise<PagedResult<AppNotification>> {
  try {
    const { data } = await apiClient.get<
      BackendNotification[] | SpringPageResponse<BackendNotification>
    >("/notifications", {
      params: { page: 0, size: 20, sort: "createdDate,desc" },
      signal,
    });
    return toPagedResult(data, toNotification);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được thông báo");
  }
}

export async function getUnreadNotificationCount(
  signal?: AbortSignal,
): Promise<number> {
  try {
    const { data } = await apiClient.get<{ count: number }>(
      "/notifications/unread-count",
      { signal },
    );
    return data.count ?? 0;
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
