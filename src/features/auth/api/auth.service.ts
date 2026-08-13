import { apiClient } from "@/lib/api-client";
import { toApiError } from "@/lib/api-error";
import { parseUserRole } from "@/lib/types/user";
import type {
  LoginApiResponse,
  LoginRequest,
  LoginResponse,
  SignupRequest,
  User,
} from "@/features/auth/api/auth.types";

function mapLoginResponse(data: LoginApiResponse): LoginResponse {
  const token = data.accessToken ?? data.token;
  const user: User | undefined = data.user
    ? {
        ...data.user,
        role: parseUserRole(data.user.role),
        department: data.user.department ?? null,
      }
    : data.id != null && data.email
      ? {
          id: data.id,
          email: data.email,
          fullName: data.fullName ?? "",
          role: parseUserRole(data.role),
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

/** Register as USER only — payload must not include `role`. */
export async function signup(input: SignupRequest): Promise<LoginResponse> {
  try {
    const { data } = await apiClient.post<LoginApiResponse>("/auth/signup", {
      email: input.email,
      password: input.password,
      fullName: input.fullName,
      ...(input.departmentId != null
        ? { departmentId: input.departmentId }
        : {}),
    });
    return mapLoginResponse(data);
  } catch (error) {
    throw toApiError(error, "Đăng ký thất bại");
  }
}
