import { apiClient } from "@/lib/api-client";
import { isAbortError, toApiError } from "@/lib/api-error";
import type { Department } from "@/lib/types/department";
import type { UserRole } from "@/lib/types/user";
import type {
  AccountProfile,
  CreateUserPayload,
  DepartmentChangeRequest,
  ManagedUser,
  UpdateAccountPayload,
  UpdateUserPayload,
} from "@/features/users/api/users.types";
import type { PageParams, PagedResult } from "@/lib/pagination";
import { toPagedResult } from "@/lib/pagination";

interface BackendAdminUser {
  id: number;
  login?: string;
  email: string;
  fullName?: string;
  activated: boolean;
  /** Flat `ROLE_*` or AccountResponse `role: string[]` */
  role?: string | string[];
  authorities?: string[];
  department?: Department | null;
}

function authorityList(u: BackendAdminUser): string[] {
  if (u.authorities && u.authorities.length > 0) return u.authorities;
  if (Array.isArray(u.role)) return u.role;
  if (typeof u.role === "string") return [u.role];
  return [];
}

function toRole(u: BackendAdminUser): UserRole {
  if (
    authorityList(u).some((a) => a === "ROLE_ADMIN" || a === "ADMIN")
  ) {
    return "ADMIN";
  }
  return "USER";
}

function toAuthorities(role: UserRole): string[] {
  return role === "ADMIN" ? ["ROLE_ADMIN", "ROLE_USER"] : ["ROLE_USER"];
}

/** Remote CreateUserRequest / UpdateUserRequest enum */
function toRemoteRole(role: UserRole): "ROLE_ADMIN" | "ROLE_USER" {
  return role === "ADMIN" ? "ROLE_ADMIN" : "ROLE_USER";
}

function toManagedUser(u: BackendAdminUser): ManagedUser {
  const role = toRole(u);
  const authorities = authorityList(u);
  return {
    id: u.id,
    login: u.login ?? u.email,
    email: u.email,
    fullName: u.fullName ?? "",
    activated: u.activated,
    authorities: authorities.length > 0 ? authorities : toAuthorities(role),
    role,
    department: u.department ?? null,
  };
}

function toAccountProfile(u: BackendAdminUser): AccountProfile {
  const role = toRole(u);
  const authorities = authorityList(u);
  return {
    id: u.id,
    login: u.login ?? u.email,
    email: u.email,
    fullName: u.fullName ?? "",
    activated: u.activated,
    authorities: authorities.length > 0 ? authorities : toAuthorities(role),
    department: u.department ?? null,
  };
}

export async function getAccount(
  signal?: AbortSignal,
): Promise<AccountProfile> {
  try {
    const { data } = await apiClient.get<BackendAdminUser>("/account", {
      signal,
    });
    return toAccountProfile(data);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được thông tin tài khoản");
  }
}

export async function updateAccount(
  payload: UpdateAccountPayload,
): Promise<AccountProfile> {
  try {
    const { data } = await apiClient.put<BackendAdminUser>("/account", payload);
    return toAccountProfile(data);
  } catch (error) {
    throw toApiError(error, "Không cập nhật được thông tin");
  }
}

export async function requestDepartmentChange(
  requestedDepartmentId: number,
): Promise<DepartmentChangeRequest> {
  try {
    const { data } = await apiClient.post<DepartmentChangeRequest>(
      "/department-change-requests",
      { requestedDepartmentId },
    );
    return data;
  } catch (error) {
    throw toApiError(error, "Không gửi được yêu cầu đổi phòng ban");
  }
}

export async function getMyPendingDepartmentChange(
  signal?: AbortSignal,
): Promise<DepartmentChangeRequest | null> {
  try {
    const { data, status } = await apiClient.get<DepartmentChangeRequest>(
      "/department-change-requests/pending",
      { signal, validateStatus: (s) => s === 200 || s === 204 },
    );
    if (status === 204 || !data) return null;
    return data;
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được yêu cầu đổi phòng ban");
  }
}

export async function getUsers(signal?: AbortSignal): Promise<ManagedUser[]> {
  const page = await getUsersPage({ page: 0, size: 200, sort: "id,asc", signal });
  return page.items;
}

export interface GetUsersOptions extends PageParams {
  /** Search fullName, email, login, department name */
  q?: string;
  /** `true` / `false`; omit for all */
  activated?: boolean;
  signal?: AbortSignal;
}

/** Paginated admin users — list + `X-Total-Count`, or Spring `{ content, totalElements }`. */
export async function getUsersPage(
  options: GetUsersOptions = {},
): Promise<PagedResult<ManagedUser>> {
  const { signal, page = 0, size = 10, sort, q, activated } = options;
  try {
    const { data, headers } = await apiClient.get<
      | BackendAdminUser[]
      | {
          content?: BackendAdminUser[];
          totalElements?: number;
          totalPages?: number;
          number?: number;
          size?: number;
        }
    >("/admin/users", {
      params: {
        page,
        size,
        ...(sort ? { sort } : {}),
        ...(q?.trim() ? { q: q.trim() } : {}),
        ...(activated !== undefined ? { activated } : {}),
      },
      signal,
    });
    const result = toPagedResult(data, toManagedUser);
    const totalHeader = headers["x-total-count"];
    if (totalHeader != null) {
      const totalElements = Number(totalHeader);
      if (Number.isFinite(totalElements)) {
        return {
          ...result,
          page,
          size,
          totalElements,
          totalPages: size > 0 ? Math.ceil(totalElements / size) : 1,
        };
      }
    }
    return { ...result, page: result.page || page, size: result.size || size };
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được danh sách user");
  }
}

export async function createUser(
  payload: CreateUserPayload,
): Promise<ManagedUser> {
  const body = {
    email: payload.email.toLowerCase(),
    fullName: payload.fullName,
    password: payload.password,
    activated: payload.activated ?? true,
    role: toRemoteRole(payload.role),
    ...(payload.departmentId != null
      ? { departmentId: payload.departmentId }
      : {}),
  };
  try {
    const { data } = await apiClient.post<BackendAdminUser>(
      "/admin/users",
      body,
    );
    return toManagedUser(data);
  } catch (error) {
    throw toApiError(error, "Không tạo được user");
  }
}

export async function updateUser(
  payload: UpdateUserPayload,
): Promise<ManagedUser> {
  const body = {
    email: payload.email.toLowerCase(),
    fullName: payload.fullName,
    activated: payload.activated,
    role: toRemoteRole(payload.role),
    ...(payload.departmentId != null
      ? { departmentId: payload.departmentId }
      : { departmentId: null }),
  };
  try {
    const { data } = await apiClient.put<BackendAdminUser>(
      `/admin/users/${payload.id}`,
      body,
    );
    return toManagedUser(data);
  } catch (error) {
    throw toApiError(error, "Không cập nhật được user");
  }
}

/** Remote Swagger: PATCH /admin/users/{id}/deactivate */
export async function deactivateUser(id: number): Promise<void> {
  try {
    await apiClient.patch(`/admin/users/${id}/deactivate`);
  } catch (error) {
    throw toApiError(error, "Không vô hiệu hóa được user");
  }
}

export async function getDepartmentChangeRequests(
  status: "PENDING" | "APPROVED" | "REJECTED" | undefined = "PENDING",
  signal?: AbortSignal,
): Promise<DepartmentChangeRequest[]> {
  try {
    const { data } = await apiClient.get<
      DepartmentChangeRequest[] | { content: DepartmentChangeRequest[] }
    >("/admin/department-change-requests", {
      params: { status, page: 0, size: 100, sort: "id,desc" },
      signal,
    });
    if (Array.isArray(data)) return data;
    return data.content ?? [];
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toApiError(error, "Không tải được yêu cầu đổi phòng ban");
  }
}

export async function approveDepartmentChange(
  id: number,
): Promise<DepartmentChangeRequest> {
  try {
    const { data } = await apiClient.post<DepartmentChangeRequest>(
      `/admin/department-change-requests/${id}/approve`,
    );
    return data;
  } catch (error) {
    throw toApiError(error, "Không duyệt được yêu cầu");
  }
}

export async function rejectDepartmentChange(
  id: number,
): Promise<DepartmentChangeRequest> {
  try {
    const { data } = await apiClient.post<DepartmentChangeRequest>(
      `/admin/department-change-requests/${id}/reject`,
    );
    return data;
  } catch (error) {
    throw toApiError(error, "Không từ chối được yêu cầu");
  }
}
