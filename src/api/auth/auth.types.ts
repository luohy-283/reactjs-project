export type UserRole = "ADMIN" | "USER";

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
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
  user?: User;
}
