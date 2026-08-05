import { Routes, Route } from "react-router";
import GuestRoute from "@/app/components/GuestRoute";
import ProtectedLayout from "@/app/layouts/ProtectedLayout";
import RequireRole from "@/app/components/RequireRole";
import RootRedirect from "@/app/components/RootRedirect";
import AuthLogoutListener from "@/app/components/AuthLogoutListener";
import LoginPage from "@/features/auth/components/LoginPage";
import AdminBookingsPage from "@/features/bookings/components/AdminBookingsPage";
import AdminRevenuePage from "@/features/revenue/components/AdminRevenuePage";
import MyInvoicesPage from "@/features/invoices/components/MyInvoicesPage";
import AdminRoomsRoute from "@/app/routes/AdminRoomsRoute";
import AdminUsersRoute from "@/app/routes/AdminUsersRoute";
import DashboardRoute from "@/app/routes/DashboardRoute";

export function AppRouter() {
  return (
    <>
      <AuthLogoutListener />
      <Routes>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardRoute />} />
          <Route path="/my-invoices" element={<MyInvoicesPage />} />
          <Route
            path="/admin/rooms"
            element={
              <RequireRole allowedRoles={["ADMIN"]}>
                <AdminRoomsRoute />
              </RequireRole>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <RequireRole allowedRoles={["ADMIN"]}>
                <AdminBookingsPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RequireRole allowedRoles={["ADMIN"]}>
                <AdminUsersRoute />
              </RequireRole>
            }
          />
          <Route
            path="/admin/revenue"
            element={
              <RequireRole allowedRoles={["ADMIN"]}>
                <AdminRevenuePage />
              </RequireRole>
            }
          />
        </Route>
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </>
  );
}
