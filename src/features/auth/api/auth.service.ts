import { apiClient } from "@/lib/api-client";
import { toApiError } from "@/lib/api-error";
import type {
  LoginApiResponse,
  LoginRequest,
  LoginResponse,
  User,
  UserRole,
} from "@/features/auth/api/auth.types";

function normalizeRole(role: string | undefined): UserRole {
  if (role === "ADMIN" || role === "ROLE_ADMIN") return "ADMIN";
  return "USER";
}

function mapLoginResponse(data: LoginApiResponse): LoginResponse {
  const token = data.accessToken ?? data.token;
  const user: User | undefined = data.user
    ? {
        ...data.user,
        role: normalizeRole(data.user.role),
        department: data.user.department ?? null,
      }
    : data.id != null && data.email
      ? {
          id: data.id,
          email: data.email,
          fullName: data.fullName ?? "",
          role: normalizeRole(data.role),
          department: data.department ?? null,
        }
      : undefined;

  if (!token || !user) {
    throw new Error("Phản hồi đăng nhập không hợp lệ");
  }

  return { token, user };
}

export async function login(input: LoginRequest): Promise<LoginResponse> {
  try {
    const { data } = await apiClient.post<LoginApiResponse>(
      "/auth/login",
      input,
    );
    return mapLoginResponse(data);
  } catch (error) {
    throw toApiError(error, "Đăng nhập thất bại");
  }
}
