import type { Department } from "@/lib/types/department";
import type { RoomLayoutType } from "@/lib/room-layout";

export type { RoomLayoutType } from "@/lib/room-layout";

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
  layoutType?: RoomLayoutType;
  floorWidthM?: number;
  floorDepthM?: number;
  /** Distinct OK equipment categories (from list enrichment — filters). */
  equipmentCategories?: string[];
  /** Distinct OK equipment catalog names (from list enrichment — UI labels). */
  equipmentNames?: string[];
}

export interface CreateRoomPayload {
  name: string;
  capacity: number;
  lockedDepartmentId?: number | null;
  pricePerHour: number;
  isVip?: boolean;
  vipAmenities?: string | null;
  layoutType?: RoomLayoutType;
  floorWidthM?: number;
  floorDepthM?: number;
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
  layoutType?: RoomLayoutType;
  floorWidthM?: number;
  floorDepthM?: number;
}

/** Stored as CSV on Room.vipAmenities */
export const VIP_AMENITY_OPTIONS = [
  { value: "VIDEO_4K", label: "Video 4K" },
  { value: "SOUNDPROOF", label: "Cách âm" },
  { value: "CATERING", label: "Catering" },
  { value: "DEDICATED_SUPPORT", label: "Hỗ trợ riêng" },
  { value: "PRIVACY_GLASS", label: "Kính riêng tư" },
] as const;

export const ROOM_LAYOUT_OPTIONS: {
  value: RoomLayoutType;
  label: string;
  defaultWidth: number;
  defaultDepth: number;
}[] = [
  { value: "COMPACT", label: "Gọn", defaultWidth: 4, defaultDepth: 3 },
  { value: "STANDARD", label: "Tiêu chuẩn", defaultWidth: 6.5, defaultDepth: 5 },
  { value: "SPACIOUS", label: "Không gian lớn", defaultWidth: 9, defaultDepth: 6.5 },
  { value: "BOARDROOM", label: "Boardroom", defaultWidth: 10, defaultDepth: 5 },
  {
    value: "AUDITORIUM",
    label: "Hội trường",
    defaultWidth: 14,
    defaultDepth: 10,
  },
];
