import { useState } from "react";
import { Layout, Space, theme } from "antd";
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

const { Content } = Layout;

export default function AppLayout() {
  const { token } = theme.useToken();
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

  const shellTheme = isDark ? "dark" : "light";

  return (
    <Layout
      style={{
        height: "100vh",
        overflow: "hidden",
        background: token.colorBgLayout,
      }}
    >
      <Topbar
        showMenuToggle={isMobileNav}
        menuCollapsed={siderCollapsed}
        onMenuToggle={() => setSiderCollapsed((prev) => !prev)}
        extra={
          <Space size="middle" align="center">
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
          </Space>
        }
      />
      <Layout
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          background: token.colorBgLayout,
        }}
      >
        <Sidebar
          theme={shellTheme}
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
            theme={shellTheme}
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
        <Layout
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            overflow: "auto",
            background: token.colorBgLayout,
          }}
        >
          <Content style={{ margin: 24, minHeight: 280 }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>

      <ProfileDialog
        open={profileOpen}
        user={user}
        departments={departments}
        onClose={() => setProfileOpen(false)}
        onUpdated={setUser}
      />
    </Layout>
  );
}
