import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "@/features/auth/context/AuthContext";

export default function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
