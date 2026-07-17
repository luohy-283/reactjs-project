import { Navigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import AppLayout from "./AppLayout";

export default function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <AppLayout />;
}
