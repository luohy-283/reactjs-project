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
  RoomLayoutType,
  UpdateRoomPayload,
} from "@/features/rooms/api/rooms.types";
import type { Department } from "@/lib/types/department";

interface BackendRoom {
  id: number;
  name: string;
  capacity: number;
  isActive?: boolean;
  active?: boolean;
  lockedDepartment?: Department | null;
  pricePerHour?: number;
  isVip?: boolean;
  vipAmenities?: string | null;
  layoutType?: RoomLayoutType;
  floorWidthM?: number | string;
  floorDepthM?: number | string;
  equipmentCategories?: string[];
  equipmentNames?: string[];
}

export interface GetRoomsOptions extends PageParams {
  /** Text search: name, capacity, locked department name/code */
  q?: string;
  /** Filter by isActive; omit for all (admin) */
  active?: boolean;
  /** Filter by VIP flag; omit for all */
  vip?: boolean;
  /** AND filter: room must have OK inventory for each category */
  equipmentCategory?: string[];
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
    isVip: Boolean(room.isVip),
    vipAmenities: room.vipAmenities ?? null,
    layoutType: room.layoutType ?? "STANDARD",
    floorWidthM: room.floorWidthM != null ? Number(room.floorWidthM) : undefined,
    floorDepthM: room.floorDepthM != null ? Number(room.floorDepthM) : undefined,
    equipmentCategories: Array.isArray(room.equipmentCategories)
      ? room.equipmentCategories
      : [],
    equipmentNames: Array.isArray(room.equipmentNames) ? room.equipmentNames : [],
  };
}

function buildQueryParams(options: Omit<GetRoomsOptions, "signal">) {
  const params: Record<string, string | number | boolean | string[]> = {};
  if (options.q?.trim()) params.q = options.q.trim();
  if (options.active !== undefined) params.active = options.active;
  if (options.vip !== undefined) params.vip = options.vip;
  if (options.equipmentCategory && options.equipmentCategory.length > 0) {
    params.equipmentCategory = options.equipmentCategory;
  }
  if (options.page != null) params.page = options.page;
  if (options.size != null) params.size = options.size;
  if (options.sort) params.sort = options.sort;
  return Object.keys(params).length > 0 ? params : undefined;
}

/** Paginated list — Admin rooms table. */
export async function getRoomsPage(
  options: GetRoomsOptions = {},
): Promise<PagedResult<Room>> {
  const { signal, ...query } = options;
  try {
    const { data } = await apiClient.get<
      BackendRoom[] | BackendRoom | SpringPageResponse<BackendRoom>
    >("/rooms", {
      params: buildQueryParams(query),
      signal,
    });
    return toPagedResult(data, toRoom);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được danh sách phòng");
  }
}

/** Full list — BE returns a page; request a large size for admin/schedule tables. */
export async function getRooms(
  signal?: AbortSignal,
  options?: Pick<GetRoomsOptions, "active" | "q" | "equipmentCategory" | "vip">,
): Promise<Room[]> {
  const result = await getRoomsPage({
    signal,
    page: 0,
    size: 200,
    ...options,
  });
  return result.items;
}

function lockedDepartmentJson(lockedDepartmentId?: number | null): { id: number } | null {
  if (lockedDepartmentId == null) return null;
  return { id: lockedDepartmentId };
}

/** Remote Swagger: POST /api/rooms only (no /admin/rooms). isActive defaulted by BE. */
export async function createRoom(payload: CreateRoomPayload): Promise<Room> {
  const body: Record<string, unknown> = {
    name: payload.name,
    capacity: payload.capacity,
    pricePerHour: payload.pricePerHour,
    lockedDepartment: lockedDepartmentJson(payload.lockedDepartmentId),
  };
  if (payload.isVip !== undefined) body.isVip = payload.isVip;
  if (payload.vipAmenities !== undefined) {
    body.vipAmenities = payload.vipAmenities;
  }
  if (payload.layoutType !== undefined) body.layoutType = payload.layoutType;
  if (payload.floorWidthM !== undefined) body.floorWidthM = payload.floorWidthM;
  if (payload.floorDepthM !== undefined) body.floorDepthM = payload.floorDepthM;
  try {
    const { data } = await apiClient.post<BackendRoom>("/rooms", body);
    return toRoom(data);
  } catch (error) {
    throw toApiError(error, "Không tạo được phòng");
  }
}

/** PATCH /api/rooms/{id} — body always includes `id` (same as path). */
export async function updateRoom(payload: UpdateRoomPayload): Promise<Room> {
  const isStatusOnly =
    payload.isActive !== undefined &&
    payload.name === undefined &&
    payload.capacity === undefined &&
    payload.lockedDepartmentId === undefined &&
    payload.pricePerHour === undefined &&
    payload.isVip === undefined &&
    payload.vipAmenities === undefined &&
    payload.layoutType === undefined &&
    payload.floorWidthM === undefined &&
    payload.floorDepthM === undefined;

  const body: Record<string, unknown> = isStatusOnly
    ? { id: payload.id, isActive: payload.isActive }
    : {
        id: payload.id,
        name: payload.name,
        capacity: payload.capacity,
        isActive: payload.isActive,
        pricePerHour: payload.pricePerHour,
        isVip: payload.isVip,
        vipAmenities: payload.vipAmenities,
        layoutType: payload.layoutType,
        floorWidthM: payload.floorWidthM,
        floorDepthM: payload.floorDepthM,
        lockedDepartment: lockedDepartmentJson(payload.lockedDepartmentId),
      };

  try {
    const { data } = await apiClient.patch<BackendRoom>(
      `/rooms/${payload.id}`,
      body,
    );
    return toRoom(data);
  } catch (error) {
    throw toApiError(error, "Không cập nhật được phòng");
  }
}
