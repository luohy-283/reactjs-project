import { useState } from "react";
import { Layout } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Topbar } from "@/components/layouts/Topbar";
import { Sidebar } from "@/components/layouts/Sidebar";
import { AppMenu } from "@/components/layouts/Menu";
import { defineMenuItems } from "@/components/layouts/MenuItem";
import { UserMenu } from "@/components/layouts/UserMenu";
import { ProfileDialog } from "@/features/users/components/ProfileDialog";

const { Content } = Layout;

export default function AppLayout() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

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
    <Layout style={{ minHeight: "100vh" }}>
      <Topbar
        extra={
          <UserMenu
            userName={user?.fullName}
            role={user?.role}
            departmentName={user?.department?.name}
            onLogout={handleLogout}
            onOpenProfile={() => setProfileOpen(true)}
            onOpenInvoices={() => navigate("/my-invoices")}
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

      <ProfileDialog
        open={profileOpen}
        user={user}
        onClose={() => setProfileOpen(false)}
        onUpdated={setUser}
      />
    </Layout>
  );
}
