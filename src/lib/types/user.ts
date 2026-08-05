import type { Department } from "@/lib/types/department";

export type UserRole = "ADMIN" | "USER";

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  department?: Department | null;
}
