import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/features/auth/context/AuthContext";
import { onAuthLogout } from "@/lib/auth-events";

export default function AuthLogoutListener() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    return onAuthLogout(() => {
      logout();
      navigate("/login", { replace: true });
    });
  }, [logout, navigate]);

  return null;
}
