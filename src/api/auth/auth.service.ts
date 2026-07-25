import { apiClient } from "../../lib/api-client";
import { getApiErrorMessage } from "../../lib/api-error";
import type { LoginRequest, LoginResponse } from "./auth.types";

export async function login(input: LoginRequest): Promise<LoginResponse> {
  try {
    const { data } = await apiClient.post<LoginResponse>("/auth/login", input);
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Đăng nhập thất bại"));
  }
}
