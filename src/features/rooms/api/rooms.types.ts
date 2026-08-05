import type { Department } from "@/lib/types/department";

export interface Room {
  id: number;
  name: string;
  capacity: number;
  isActive: boolean;
  lockedDepartment?: Department | null;
  /** VND per hour */
  pricePerHour: number;
}

export interface CreateRoomPayload {
  name: string;
  capacity: number;
  lockedDepartmentId?: number | null;
  pricePerHour: number;
}

export interface UpdateRoomPayload {
  id: number;
  name?: string;
  capacity?: number;
  isActive?: boolean;
  lockedDepartmentId?: number | null;
  pricePerHour?: number;
}
