import { isAxiosError, type AxiosError } from "axios";
import { apiClient } from "@/lib/api-client";
import { isAbortError, toApiError } from "@/lib/api-error";
import {
  type PageParams,
  type PagedResult,
  type SpringPageResponse,
  toPagedResult,
} from "@/lib/pagination";
import type {
  CreateRoomPayload,
  Room,
  UpdateRoomPayload,
} from "@/features/rooms/api/rooms.types";
import type { Department } from "@/features/departments/api/departments.types";

interface BackendRoom {
  id: number;
  name: string;
  capacity: number;
  isActive?: boolean;
  active?: boolean;
  lockedDepartment?: Department | null;
  pricePerHour?: number;
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
    lockedDepartment: room.lockedDepartment ?? null,
    pricePerHour: Number(room.pricePerHour ?? 0),
  };
}

function isMissingAdminRoute(error: unknown): error is AxiosError {
  if (!isAxiosError(error)) return false;
  // Only fall back when the /api/admin/rooms route does not exist.
  // Do not swallow 400 business errors (e.g. hasbookings) or 500s.
  return error.response?.status === 404;
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

/** Full list — BE returns a page; request a large size for admin/schedule tables. */
export async function getRooms(signal?: AbortSignal): Promise<Room[]> {
  const result = await getRoomsPage({ signal, page: 0, size: 200 });
  return result.items;
}

export async function createRoom(payload: CreateRoomPayload): Promise<Room> {
  const body = {
    name: payload.name,
    capacity: payload.capacity,
    isActive: true,
    pricePerHour: payload.pricePerHour,
    lockedDepartment:
      payload.lockedDepartmentId != null
        ? { id: payload.lockedDepartmentId }
        : null,
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
  const isStatusOnly =
    payload.isActive !== undefined &&
    payload.name === undefined &&
    payload.capacity === undefined &&
    payload.lockedDepartmentId === undefined &&
    payload.pricePerHour === undefined;

  try {
    if (isStatusOnly) {
      const body = { id: payload.id, isActive: payload.isActive };
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
    }

    const body = {
      id: payload.id,
      name: payload.name,
      capacity: payload.capacity,
      isActive: payload.isActive,
      pricePerHour: payload.pricePerHour,
      lockedDepartment:
        payload.lockedDepartmentId != null
          ? { id: payload.lockedDepartmentId }
          : null,
    };
    try {
      const { data } = await apiClient.put<BackendRoom>(
        `/admin/rooms/${payload.id}`,
        body,
      );
      return toRoom(data);
    } catch (error) {
      if (!isMissingAdminRoute(error)) throw error;
      const { data } = await apiClient.put<BackendRoom>(
        `/rooms/${payload.id}`,
        body,
      );
      return toRoom(data);
    }
  } catch (error) {
    throw toApiError(error, "Không cập nhật được phòng");
  }
}
