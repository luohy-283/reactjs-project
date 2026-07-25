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
  isActive: boolean;
}

function toRoom(room: BackendRoom): Room {
  return {
    id: room.id,
    name: room.name,
    capacity: room.capacity,
    isActive: room.isActive,
  };
}

export async function getRooms(signal?: AbortSignal): Promise<Room[]> {
  try {
    const { data } = await apiClient.get<BackendRoom[]>("/rooms", { signal });
    return data.map(toRoom);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được danh sách phòng");
  }
}

export async function createRoom(payload: CreateRoomPayload): Promise<Room> {
  try {
    const { data } = await apiClient.post<BackendRoom>("/rooms", {
      name: payload.name,
      capacity: payload.capacity,
      isActive: true,
    });
    return toRoom(data);
  } catch (error) {
    throw toApiError(error, "Không tạo được phòng");
  }
}

export async function updateRoom(payload: UpdateRoomPayload): Promise<Room> {
  try {
    const { data } = await apiClient.patch<BackendRoom>(`/rooms/${payload.id}`, {
      id: payload.id,
      name: payload.name,
      capacity: payload.capacity,
      isActive: payload.isActive,
    });
    return toRoom(data);
  } catch (error) {
    throw toApiError(error, "Không cập nhật được phòng");
  }
}
