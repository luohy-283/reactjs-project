import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { App as AntApp, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { AuthProvider } from "./context/AuthContext";
import GuestRoute from "./components/GuestRoute";
import ProtectedLayout from "./components/ProtectedLayout";
import RequireRole from "./components/RequireRole";
import RootRedirect from "./components/RootRedirect";
import AuthLogoutListener from "./components/AuthLogoutListener";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminRooms from "./pages/AdminRooms";
import "./lib/api-client";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider locale={viVN}>
      <AntApp>
        <BrowserRouter>
          <AuthProvider>
            <AuthLogoutListener />
            <Routes>
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <Login />
                  </GuestRoute>
                }
              />
              <Route element={<ProtectedLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route
                  path="/admin/rooms"
                  element={
                    <RequireRole allowedRoles={["ADMIN"]}>
                      <AdminRooms />
                    </RequireRole>
                  }
                />
              </Route>
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  </StrictMode>,
);
