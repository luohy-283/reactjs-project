import type { Department } from "@/lib/types/department";

export type UserRole = "ADMIN" | "MANAGER" | "STAFF" | "USER";

export const USER_ROLES: UserRole[] = ["ADMIN", "MANAGER", "STAFF", "USER"];

/** Parse BE role / ROLE_* / authorities → primary role. Throws if unknown. */
export function parseUserRole(raw: string | undefined | null): UserRole {
  if (!raw) {
    throw new Error("Thiếu role từ máy chủ");
  }
  const normalized = raw.replace(/^ROLE_/, "").toUpperCase();
  if (
    normalized === "ADMIN" ||
    normalized === "MANAGER" ||
    normalized === "STAFF" ||
    normalized === "USER"
  ) {
    return normalized;
  }
  throw new Error(`Role không hợp lệ: ${raw}`);
}

/** Highest role from a list of authorities / ROLE_* strings. */
export function primaryRoleFromAuthorities(authorities: string[]): UserRole {
  const roles = new Set(
    authorities.map((a) => a.replace(/^ROLE_/, "").toUpperCase()),
  );
  if (roles.has("ADMIN")) return "ADMIN";
  if (roles.has("MANAGER")) return "MANAGER";
  if (roles.has("STAFF")) return "STAFF";
  if (roles.has("USER")) return "USER";
  throw new Error("Không xác định được role từ authorities");
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  department?: Department | null;
}
