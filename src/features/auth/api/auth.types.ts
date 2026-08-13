import type { Department } from "@/lib/types/department";
import type { User, UserRole } from "@/lib/types/user";

export type { User, UserRole, Department };

/** @deprecated Prefer `Department` from `@/lib/types/department`. */
export type DepartmentSummary = Department;

export interface LoginRequest {
  email: string;
  password: string;
}

/** Sign-up body — never include `role` (BE assigns USER). */
export interface SignupRequest {
  email: string;
  password: string;
  fullName: string;
  departmentId?: number;
}

/** Normalized shape used by AuthContext after mapping the API payload. */
export interface LoginResponse {
  token: string;
  user: User;
}

/**
 * Raw login JSON from backend.
 * Remote/ngrok may return a flat `{ accessToken, id, email, ... }` body;
 * local JHipster AuthController may return `{ token, user }`.
 */
export interface LoginApiResponse {
  accessToken?: string;
  token?: string;
  tokenType?: string;
  id?: number;
  email?: string;
  fullName?: string;
  role?: string;
  department?: Department | null;
  user?: User;
}
