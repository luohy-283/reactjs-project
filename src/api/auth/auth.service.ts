import { mockLogin } from "../../lib/mockApi";
import type { LoginRequest, LoginResponse } from "./auth.types";

export async function login(input: LoginRequest): Promise<LoginResponse> {
  return mockLogin(input.email, input.password);
}
