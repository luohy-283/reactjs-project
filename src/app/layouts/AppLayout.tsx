import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useDepartments } from "@/features/departments/api/departments.hooks";
import { NotificationBell } from "@/app/components/NotificationBell";
import { useThemeMode } from "@/app/theme/useThemeMode";
import { Topbar } from "@/components/layouts/Topbar";
import { Sidebar } from "@/components/layouts/Sidebar";
import { AppMenu } from "@/components/layouts/Menu";
import { defineMenuItems } from "@/components/layouts/MenuItem";
import { ThemeToggle } from "@/components/layouts/ThemeToggle";
import { UserMenu } from "@/components/layouts/UserMenu";
import { ProfileDialog } from "@/features/users/components/ProfileDialog";

export default function AppLayout() {
  const { user, logout, setUser } = useAuth();
  const { isDark, toggleTheme } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [siderCollapsed, setSiderCollapsed] = useState(false);
  const [isMobileNav, setIsMobileNav] = useState(false);
  const { data: departments } = useDepartments(profileOpen);

  const menuItems = defineMenuItems([
    { key: "/dashboard", label: "Dashboard" },
    ...(user?.role === "ADMIN"
      ? [
          { key: "/admin/rooms", label: "Quản lý phòng" },
          { key: "/admin/bookings", label: "Duyệt đặt phòng" },
          { key: "/admin/users", label: "Quản lý user" },
          { key: "/admin/revenue", label: "Doanh thu" },
        ]
      : []),
  ]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Topbar
        showMenuToggle={isMobileNav}
        menuCollapsed={siderCollapsed}
        onMenuToggle={() => setSiderCollapsed((prev) => !prev)}
        extra={
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <NotificationBell />
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <UserMenu
              userName={user?.fullName}
              role={user?.role}
              departmentName={user?.department?.name}
              onLogout={handleLogout}
              onOpenProfile={() => setProfileOpen(true)}
              onOpenInvoices={() => navigate("/my-invoices")}
            />
          </div>
        }
      />
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex" }}>
        <Sidebar
          collapsed={siderCollapsed}
          onCollapse={setSiderCollapsed}
          onBreakpoint={(broken) => {
            setIsMobileNav(broken);
            if (!broken) {
              setSiderCollapsed(false);
            }
          }}
        >
          <AppMenu
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => {
              navigate(key);
              if (isMobileNav) {
                setSiderCollapsed(true);
              }
            }}
          />
        </Sidebar>
        <main
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            overflow: "auto",
            margin: 24,
          }}
        >
          <Outlet />
        </main>
      </div>

      <ProfileDialog
        open={profileOpen}
        user={user}
        departments={departments}
        onClose={() => setProfileOpen(false)}
        onUpdated={setUser}
      />
    </div>
  );
}
