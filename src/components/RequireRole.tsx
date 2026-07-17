import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

interface RequireRoleProps {
  allowedRoles: Array<'ADMIN' | 'USER'>;
  children: ReactNode;
}

export default function RequireRole({ allowedRoles, children }: RequireRoleProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Có user nhưng role không nằm trong danh sách cho phép -> về dashboard
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}