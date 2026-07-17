import type { LoginResponse } from "../api/auth/auth.types";

export function mockLogin(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email === "admin@company.com" && password === "123456") {
        resolve({
          token: "fake-jwt-token-admin",
          user: { id: 1, email, fullName: "Admin User", role: "ADMIN" },
        });
      } else if (email === "user@company.com" && password === "123456") {
        resolve({
          token: "fake-jwt-token-user",
          user: { id: 2, email, fullName: "Normal User", role: "USER" },
        });
      } else {
        reject(new Error("Email hoặc mật khẩu không đúng"));
      }
    }, 800);
  });
}
