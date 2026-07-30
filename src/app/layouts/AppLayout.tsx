import { Layout } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Topbar } from "@/components/layouts/Topbar";
import { Sidebar } from "@/components/layouts/Sidebar";
import { AppMenu } from "@/components/layouts/Menu";
import { defineMenuItems } from "@/components/layouts/MenuItem";
import { UserMenu } from "@/components/layouts/UserMenu";

const { Content } = Layout;

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = defineMenuItems([
    { key: "/dashboard", label: "Dashboard" },
    ...(user?.role === "ADMIN"
      ? [
          { key: "/admin/rooms", label: "Quản lý phòng" },
          { key: "/admin/bookings", label: "Duyệt đặt phòng" },
        ]
      : []),
  ]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Topbar
        extra={
          <UserMenu
            userName={user?.fullName}
            role={user?.role}
            onLogout={handleLogout}
          />
        }
      />
      <Layout>
        <Sidebar>
          <AppMenu
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
          />
        </Sidebar>
        <Layout>
          <Content style={{ margin: 24, minHeight: 280 }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
