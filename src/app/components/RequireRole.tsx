import type { ReactNode } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { NoPermission } from "@/components/ui/empty/NoPermission";
import { Navigate } from "react-router";
import type { UserRole } from "@/lib/types/user";

interface RequireRoleProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

export default function RequireRole({ allowedRoles, children }: RequireRoleProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <NoPermission />;
  }

  return <>{children}</>;
}
