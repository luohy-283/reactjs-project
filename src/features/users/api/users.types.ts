import type { Department } from "@/features/departments/api/departments.types";
import type { UserRole } from "@/features/auth/api/auth.types";

export interface ManagedUser {
  id: number;
  login: string;
  email: string;
  fullName: string;
  activated: boolean;
  authorities: string[];
  role: UserRole;
  department?: Department | null;
}

export interface CreateUserPayload {
  email: string;
  fullName: string;
  password: string;
  role: UserRole;
  departmentId?: number | null;
  activated?: boolean;
}

export interface UpdateUserPayload {
  id: number;
  login: string;
  email: string;
  fullName: string;
  role: UserRole;
  departmentId?: number | null;
  activated: boolean;
  password?: string;
}

export type DepartmentChangeRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export interface DepartmentChangeRequest {
  id: number;
  userId: number;
  userEmail: string;
  userFullName: string;
  currentDepartment?: Department | null;
  requestedDepartment: Department;
  status: DepartmentChangeRequestStatus;
  reviewedByLogin?: string | null;
  reviewedDate?: string | null;
  createdDate?: string | null;
}

export interface AccountProfile {
  id: number;
  login: string;
  email: string;
  fullName: string;
  activated: boolean;
  authorities: string[];
  department?: Department | null;
}

export interface UpdateAccountPayload {
  fullName: string;
  email: string;
}
