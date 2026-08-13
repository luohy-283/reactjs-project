export type EquipmentCategory =
  | "PROJECTOR"
  | "DISPLAY"
  | "AUDIO"
  | "VC"
  | "OTHER";

export type RoomEquipmentStatus = "OK" | "BROKEN" | "RETIRED";

export type PurchaseStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "FULFILLED";

export interface Equipment {
  id: number;
  name: string;
  category: EquipmentCategory;
  unitCost: number;
  isActive: boolean;
}

export interface RoomEquipment {
  id: number;
  roomId: number;
  equipmentId: number;
  equipmentName: string;
  category: EquipmentCategory;
  unitCost: number;
  quantity: number;
  status: RoomEquipmentStatus;
}

export interface EquipmentPurchase {
  id: number;
  roomId: number;
  roomName?: string | null;
  equipmentId: number;
  equipmentName?: string | null;
  quantity: number;
  unitCost: number;
  reason?: string | null;
  status: PurchaseStatus;
  requestedById?: number | null;
  requestedByLogin?: string | null;
  approvedById?: number | null;
  approvedByLogin?: string | null;
  fulfilledAt?: string | null;
  createdDate?: string | null;
}

export interface CreateEquipmentPayload {
  name: string;
  category: EquipmentCategory;
  unitCost: number;
  isActive?: boolean;
}

export interface UpdateEquipmentPayload {
  id: number;
  name?: string;
  category?: EquipmentCategory;
  unitCost?: number;
  isActive?: boolean;
}

export interface CreateEquipmentPurchasePayload {
  roomId: number;
  equipmentId: number;
  quantity: number;
  unitCost?: number;
  reason?: string;
}

export interface RoomSelectOption {
  id: number;
  name: string;
}

export const EQUIPMENT_CATEGORIES: {
  value: EquipmentCategory;
  label: string;
}[] = [
  { value: "PROJECTOR", label: "Máy chiếu" },
  { value: "DISPLAY", label: "Màn hình" },
  { value: "AUDIO", label: "Âm thanh" },
  { value: "VC", label: "Họp trực tuyến" },
  { value: "OTHER", label: "Khác" },
];

export const PURCHASE_STATUS_OPTIONS: {
  value: PurchaseStatus;
  label: string;
}[] = [
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Từ chối" },
  { value: "FULFILLED", label: "Đã nhận" },
];
