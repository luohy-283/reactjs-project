import { Layout, Button } from "antd";
import { Outlet, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

const { Header, Content } = Layout;

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
      <Content style={{ margin: 24, minHeight: 280 }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
