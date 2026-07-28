import { isAxiosError, type AxiosError } from "axios";
import { apiClient } from "../../lib/api-client";
import { isAbortError, toApiError } from "../../lib/api-error";
import {
  type PageParams,
  type PagedResult,
  type SpringPageResponse,
  toPagedResult,
} from "../../lib/pagination";
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

export interface GetRoomsOptions extends PageParams {
  signal?: AbortSignal;
}

function toRoom(room: BackendRoom): Room {
  return {
    id: room.id,
    name: room.name,
    capacity: room.capacity,
    isActive: room.isActive ?? room.active ?? true,
  };
}

function isMissingAdminRoute(error: unknown): error is AxiosError {
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 404 || status === 500;
}

function buildPageParams(options?: PageParams) {
  if (!options?.page && !options?.size && !options?.sort) return undefined;
  return {
    page: options.page,
    size: options.size,
    sort: options.sort,
  };
}

/** Paginated list — Admin rooms table. */
export async function getRoomsPage(
  options: GetRoomsOptions = {},
): Promise<PagedResult<Room>> {
  const { signal, ...pageParams } = options;
  try {
    const { data } = await apiClient.get<
      BackendRoom[] | BackendRoom | SpringPageResponse<BackendRoom>
    >("/rooms", {
      params: buildPageParams(pageParams),
      signal,
    });
    return toPagedResult(data, toRoom);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được danh sách phòng");
  }
}

/** Full list helper — Dashboard dropdown / schedule (large page size). */
export async function getRooms(signal?: AbortSignal): Promise<Room[]> {
  const result = await getRoomsPage({ page: 0, size: 500, signal });
  return result.items;
}

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
