import type { Department } from "@/lib/types/department";

export interface Room {
  id: number;
  name: string;
  capacity: number;
  isActive: boolean;
  lockedDepartment?: Department | null;
  /** VND per hour */
  pricePerHour: number;
  isVip?: boolean;
  vipAmenities?: string | null;
}

export interface CreateRoomPayload {
  name: string;
  capacity: number;
  lockedDepartmentId?: number | null;
  pricePerHour: number;
  isVip?: boolean;
  vipAmenities?: string | null;
}

export interface UpdateRoomPayload {
  id: number;
  name?: string;
  capacity?: number;
  isActive?: boolean;
  lockedDepartmentId?: number | null;
  pricePerHour?: number;
  isVip?: boolean;
  vipAmenities?: string | null;
}

/** Stored as CSV on Room.vipAmenities */
export const VIP_AMENITY_OPTIONS = [
  { value: "VIDEO_4K", label: "Video 4K" },
  { value: "SOUNDPROOF", label: "Cách âm" },
  { value: "CATERING", label: "Catering" },
  { value: "DEDICATED_SUPPORT", label: "Hỗ trợ riêng" },
  { value: "PRIVACY_GLASS", label: "Kính riêng tư" },
] as const;
