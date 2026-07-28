import { isAxiosError, type AxiosError } from "axios";
import { apiClient } from "../../lib/api-client";
import { isAbortError, toApiError } from "../../lib/api-error";
import type {
  CreateRoomPayload,
  Room,
  UpdateRoomPayload,
} from "./rooms.types";

interface BackendRoom {
  id: number;
  name: string;
  capacity: number;
  isActive?: boolean;
  active?: boolean;
}

function asArray<T>(data: T[] | T | null | undefined): T[] {
  if (Array.isArray(data)) return data;
  if (data == null) return [];
  return [data];
}

function toRoom(room: BackendRoom): Room {
  return {
    id: room.id,
    name: room.name,
    capacity: room.capacity,
    isActive: room.isActive ?? room.active ?? true,
  };
}

/** Local JHipster may not expose `/admin/*` (404/500). */
function isMissingAdminRoute(error: unknown): error is AxiosError {
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 404 || status === 500;
}

/** Shared list — no role check; both USER and ADMIN use this. */
export async function getRooms(signal?: AbortSignal): Promise<Room[]> {
  try {
    const { data } = await apiClient.get<BackendRoom[] | BackendRoom>(
      "/rooms",
      { signal },
    );
    return asArray(data).map(toRoom);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được danh sách phòng");
  }
}

/** ADMIN only — quản lý phòng. */
export async function createRoom(payload: CreateRoomPayload): Promise<Room> {
  const body = {
    name: payload.name,
    capacity: payload.capacity,
    isActive: true,
  };
  try {
    try {
      const { data } = await apiClient.post<BackendRoom>("/admin/rooms", body);
      return toRoom(data);
    } catch (error) {
      if (!isMissingAdminRoute(error)) throw error;
      const { data } = await apiClient.post<BackendRoom>("/rooms", body);
      return toRoom(data);
    }
  } catch (error) {
    throw toApiError(error, "Không tạo được phòng");
  }
}

/** ADMIN only — quản lý phòng. */
export async function updateRoom(payload: UpdateRoomPayload): Promise<Room> {
  const body = {
    id: payload.id,
    name: payload.name,
    capacity: payload.capacity,
    isActive: payload.isActive,
  };
  try {
    try {
      const { data } = await apiClient.patch<BackendRoom>(
        `/admin/rooms/${payload.id}`,
        body,
      );
      return toRoom(data);
    } catch (error) {
      if (!isMissingAdminRoute(error)) throw error;
      const { data } = await apiClient.patch<BackendRoom>(
        `/rooms/${payload.id}`,
        body,
      );
      return toRoom(data);
    }
  } catch (error) {
    throw toApiError(error, "Không cập nhật được phòng");
  }
}
