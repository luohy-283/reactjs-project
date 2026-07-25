import { Layout, Menu, Button } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

const { Header, Content, Sider } = Layout;

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: "/dashboard", label: "Dashboard" },
    ...(user?.role === "ADMIN"
      ? [
          { key: "/admin/rooms", label: "Quản lý phòng" },
          { key: "/admin/bookings", label: "Duyệt đặt phòng" },
        ]
      : []),
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 24px",
        }}
      >
        <div style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>
          Hệ thống Đặt phòng họp
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "#fff" }}>
            {user?.fullName} ({user?.role})
          </span>
          <Button onClick={handleLogout}>Đăng xuất</Button>
        </div>
      </Header>
      <Layout>
        <Sider breakpoint="lg" collapsedWidth={0} width={220}>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ height: "100%" }}
          />
        </Sider>
        <Layout>
          <Content style={{ margin: 24, minHeight: 280 }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
