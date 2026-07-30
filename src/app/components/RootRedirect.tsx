import { Navigate } from "react-router";
import { useAuth } from "@/features/auth/context/AuthContext";

export default function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}
