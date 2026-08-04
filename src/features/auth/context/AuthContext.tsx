import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { login as loginApi } from "@/features/auth/api/auth.service";
import type { User } from "@/features/auth/api/auth.types";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from "@/lib/auth-storage";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function readStoredUser(): User | null {
  const stored = localStorage.getItem(AUTH_USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as User;
  } catch {
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = readStoredUser();
    // Corrupt/missing user with a leftover token → clear session.
    if (storedToken && !storedUser) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      return null;
    }
    return storedToken;
  });
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = readStoredUser();
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
      if (storedUser) localStorage.removeItem(AUTH_USER_KEY);
      return null;
    }
    return storedUser;
  });

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginApi({ email, password });
    localStorage.setItem(AUTH_TOKEN_KEY, response.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
    setToken(response.token);
    setUser(response.user);
  }, []);

  const updateStoredUser = useCallback((next: User) => {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(next));
    setUser(next);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      setUser: updateStoredUser,
    }),
    [user, token, login, logout, updateStoredUser],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được dùng bên trong AuthProvider");
  }
  return context;
}
