import axios from "axios";
import { AUTH_TOKEN_KEY } from "./auth-storage";
import { emitAuthLogout } from "./auth-events";

export const apiClient = axios.create({
  baseURL: "http://localhost:8080/api",
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
