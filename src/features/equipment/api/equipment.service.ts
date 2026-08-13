import { apiClient } from "@/lib/api-client";
import { isAbortError, toApiError } from "@/lib/api-error";
import {
  type PageParams,
  type PagedResult,
  type SpringPageResponse,
  toPagedResult,
} from "@/lib/pagination";
import type {
  CreateEquipmentPayload,
  CreateEquipmentPurchasePayload,
  Equipment,
  EquipmentCategory,
  EquipmentPurchase,
  PurchaseStatus,
  RoomEquipment,
  RoomEquipmentStatus,
  RoomSelectOption,
  UpdateEquipmentPayload,
} from "@/features/equipment/api/equipment.types";

interface BackendEquipment {
  id: number;
  name: string;
  category: EquipmentCategory;
  unitCost?: number | string;
  isActive?: boolean;
  active?: boolean;
}

interface BackendRoomEquipment {
  id: number;
  roomId: number;
  equipmentId: number;
  equipmentName?: string;
  category: EquipmentCategory;
  unitCost?: number | string;
  quantity?: number;
  status: RoomEquipmentStatus;
}

interface BackendEquipmentPurchase {
  id: number;
  roomId: number;
  roomName?: string | null;
  equipmentId: number;
  equipmentName?: string | null;
  quantity?: number;
  unitCost?: number | string;
  reason?: string | null;
  status: PurchaseStatus;
  requestedById?: number | null;
  requestedByLogin?: string | null;
  approvedById?: number | null;
  approvedByLogin?: string | null;
  fulfilledAt?: string | null;
  createdDate?: string | null;
}

interface BackendRoomSelect {
  id: number;
  name: string;
}

function toEquipment(row: BackendEquipment): Equipment {
  return {
    id: Number(row.id),
    name: row.name,
    category: row.category,
    unitCost: Number(row.unitCost ?? 0),
    isActive: row.isActive ?? row.active ?? true,
  };
}

function toRoomEquipment(row: BackendRoomEquipment): RoomEquipment {
  return {
    id: Number(row.id),
    roomId: Number(row.roomId),
    equipmentId: Number(row.equipmentId),
    equipmentName: row.equipmentName ?? "",
    category: row.category,
    unitCost: Number(row.unitCost ?? 0),
    quantity: Number(row.quantity ?? 0),
    status: row.status,
  };
}

function toPurchase(row: BackendEquipmentPurchase): EquipmentPurchase {
  return {
    id: Number(row.id),
    roomId: Number(row.roomId),
    roomName: row.roomName ?? null,
    equipmentId: Number(row.equipmentId),
    equipmentName: row.equipmentName ?? null,
    quantity: Number(row.quantity ?? 0),
    unitCost: Number(row.unitCost ?? 0),
    reason: row.reason ?? null,
    status: row.status,
    requestedById:
      row.requestedById != null ? Number(row.requestedById) : null,
    requestedByLogin: row.requestedByLogin ?? null,
    approvedById: row.approvedById != null ? Number(row.approvedById) : null,
    approvedByLogin: row.approvedByLogin ?? null,
    fulfilledAt: row.fulfilledAt ?? null,
    createdDate: row.createdDate ?? null,
  };
}

export interface GetEquipmentOptions extends PageParams {
  q?: string;
  active?: boolean;
  signal?: AbortSignal;
}

export async function getEquipmentPage(
  options: GetEquipmentOptions = {},
): Promise<PagedResult<Equipment>> {
  const { signal, q, active, page, size, sort } = options;
  try {
    const { data } = await apiClient.get<
      BackendEquipment[] | SpringPageResponse<BackendEquipment>
    >("/equipment", {
      params: {
        ...(page != null ? { page } : {}),
        ...(size != null ? { size } : {}),
        ...(sort ? { sort } : {}),
        ...(q?.trim() ? { q: q.trim() } : {}),
        ...(active !== undefined ? { active } : {}),
      },
      signal,
    });
    return toPagedResult(data, toEquipment);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được danh mục thiết bị");
  }
}

export async function createEquipment(
  payload: CreateEquipmentPayload,
): Promise<Equipment> {
  try {
    const { data } = await apiClient.post<BackendEquipment>("/equipment", {
      name: payload.name,
      category: payload.category,
      unitCost: payload.unitCost,
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
    });
    return toEquipment(data);
  } catch (error) {
    throw toApiError(error, "Không tạo được thiết bị");
  }
}

export async function updateEquipment(
  payload: UpdateEquipmentPayload,
): Promise<Equipment> {
  try {
    const { data } = await apiClient.patch<BackendEquipment>(
      `/equipment/${payload.id}`,
      {
        id: payload.id,
        name: payload.name,
        category: payload.category,
        unitCost: payload.unitCost,
        isActive: payload.isActive,
      },
    );
    return toEquipment(data);
  } catch (error) {
    throw toApiError(error, "Không cập nhật được thiết bị");
  }
}

export async function getRoomEquipment(
  roomId: number,
  signal?: AbortSignal,
): Promise<RoomEquipment[]> {
  try {
    const { data } = await apiClient.get<BackendRoomEquipment[]>(
      `/rooms/${roomId}/equipment`,
      { signal },
    );
    return (Array.isArray(data) ? data : []).map(toRoomEquipment);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được thiết bị của phòng");
  }
}

export async function updateRoomEquipment(
  roomId: number,
  reId: number,
  payload: Partial<Pick<RoomEquipment, "quantity" | "status">>,
): Promise<RoomEquipment> {
  try {
    const { data } = await apiClient.patch<BackendRoomEquipment>(
      `/rooms/${roomId}/equipment/${reId}`,
      payload,
    );
    return toRoomEquipment(data);
  } catch (error) {
    throw toApiError(error, "Không cập nhật được thiết bị phòng");
  }
}

export async function putRoomEquipment(
  roomId: number,
  reId: number,
  payload: Partial<Pick<RoomEquipment, "quantity" | "status">>,
): Promise<RoomEquipment> {
  try {
    const { data } = await apiClient.put<BackendRoomEquipment>(
      `/rooms/${roomId}/equipment/${reId}`,
      payload,
    );
    return toRoomEquipment(data);
  } catch (error) {
    throw toApiError(error, "Không cập nhật được thiết bị phòng");
  }
}

export async function reportRoomEquipmentBroken(
  roomId: number,
  reId: number,
): Promise<RoomEquipment> {
  try {
    const { data } = await apiClient.post<BackendRoomEquipment>(
      `/rooms/${roomId}/equipment/${reId}/report-broken`,
    );
    return toRoomEquipment(data);
  } catch (error) {
    throw toApiError(error, "Không báo hỏng được thiết bị");
  }
}

export interface GetEquipmentPurchasesOptions extends PageParams {
  status?: PurchaseStatus;
  roomId?: number;
  signal?: AbortSignal;
}

export async function getEquipmentPurchasesPage(
  options: GetEquipmentPurchasesOptions = {},
): Promise<PagedResult<EquipmentPurchase>> {
  const { signal, status, roomId, page, size, sort } = options;
  try {
    const { data } = await apiClient.get<
      | BackendEquipmentPurchase[]
      | SpringPageResponse<BackendEquipmentPurchase>
    >("/equipment-purchases", {
      params: {
        ...(page != null ? { page } : {}),
        ...(size != null ? { size } : {}),
        ...(sort ? { sort } : {}),
        ...(status ? { status } : {}),
        ...(roomId != null ? { roomId } : {}),
      },
      signal,
    });
    return toPagedResult(data, toPurchase);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được phiếu mua thiết bị");
  }
}

export async function createEquipmentPurchase(
  payload: CreateEquipmentPurchasePayload,
): Promise<EquipmentPurchase> {
  try {
    const { data } = await apiClient.post<BackendEquipmentPurchase>(
      "/equipment-purchases",
      {
        roomId: payload.roomId,
        equipmentId: payload.equipmentId,
        quantity: payload.quantity,
        ...(payload.unitCost != null ? { unitCost: payload.unitCost } : {}),
        ...(payload.reason ? { reason: payload.reason } : {}),
      },
    );
    return toPurchase(data);
  } catch (error) {
    throw toApiError(error, "Không tạo được phiếu mua");
  }
}

export async function approveEquipmentPurchase(
  id: number,
): Promise<EquipmentPurchase> {
  try {
    const { data } = await apiClient.post<BackendEquipmentPurchase>(
      `/equipment-purchases/${id}/approve`,
    );
    return toPurchase(data);
  } catch (error) {
    throw toApiError(error, "Không duyệt được phiếu mua");
  }
}

export async function rejectEquipmentPurchase(
  id: number,
): Promise<EquipmentPurchase> {
  try {
    const { data } = await apiClient.post<BackendEquipmentPurchase>(
      `/equipment-purchases/${id}/reject`,
    );
    return toPurchase(data);
  } catch (error) {
    throw toApiError(error, "Không từ chối được phiếu mua");
  }
}

export async function fulfillEquipmentPurchase(
  id: number,
): Promise<EquipmentPurchase> {
  try {
    const { data } = await apiClient.post<BackendEquipmentPurchase>(
      `/equipment-purchases/${id}/fulfill`,
    );
    return toPurchase(data);
  } catch (error) {
    throw toApiError(error, "Không nhận hàng được");
  }
}

/** Active catalog rows for purchase Select — avoids importing features/rooms. */
export async function listEquipmentForSelect(
  signal?: AbortSignal,
): Promise<Equipment[]> {
  const page = await getEquipmentPage({
    signal,
    page: 0,
    size: 200,
    active: true,
  });
  return page.items;
}

/** Thin /rooms helper — avoids importing features/rooms. */
export async function listRoomsForSelect(
  signal?: AbortSignal,
): Promise<RoomSelectOption[]> {
  try {
    const { data } = await apiClient.get<
      BackendRoomSelect[] | SpringPageResponse<BackendRoomSelect>
    >("/rooms", {
      params: { page: 0, size: 200, active: true },
      signal,
    });
    const page = toPagedResult(data, (r) => ({
      id: Number(r.id),
      name: r.name,
    }));
    return page.items;
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được danh sách phòng");
  }
}
