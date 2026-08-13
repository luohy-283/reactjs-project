import axios from "axios";
import { AUTH_TOKEN_KEY } from "@/lib/auth-storage";
import { emitAuthLogout } from "@/lib/auth-events";
import { serializeSpringParams } from "@/lib/pagination";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

// Only needed when the browser talks to ngrok directly (no Vite proxy).
const isDirectNgrok = /ngrok/i.test(apiBaseUrl);

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: isDirectNgrok
    ? { "ngrok-skip-browser-warning": "true" }
    : undefined,
  paramsSerializer: {
    serialize: (params) =>
      serializeSpringParams(params as Record<string, unknown>),
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      emitAuthLogout();
    }
    return Promise.reject(error);
  },
);
