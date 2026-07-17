import { Card } from "antd";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <Card title="Dashboard">
      <p>
        Xin chào, <strong>{user?.fullName}</strong> ({user?.role})
      </p>
      <p>Đăng nhập thành công.</p>
    </Card>
  );
}
