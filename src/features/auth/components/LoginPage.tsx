import { useState } from "react";
import { Form, Input, Button, Typography } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router";
import { ErrorMessage } from "@/components/ui/error/ErrorMessage";
import { AuthGuestLayout } from "@/features/auth/components/AuthGuestLayout";
import { useAuth } from "@/features/auth/context/AuthContext";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    setErrorMsg("");

    try {
      await login(values.email, values.password);
      const from =
        (location.state as { from?: { pathname?: string } } | null)?.from
          ?.pathname ?? "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuestLayout
      title="Đăng nhập"
      footer={
        <Typography.Paragraph style={{ marginBottom: 0, textAlign: "center" }}>
          Chưa có tài khoản? <Link to="/signup">Đăng ký</Link>
        </Typography.Paragraph>
      }
    >
      <ErrorMessage message={errorMsg} style={{ marginBottom: 16 }} />
      <Form layout="vertical" onFinish={handleLogin}>
        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, message: "Vui lòng nhập email" }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Nhập email" />
        </Form.Item>

        <Form.Item
          label="Mật khẩu"
          name="password"
          rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Nhập mật khẩu"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Đăng nhập
          </Button>
        </Form.Item>
      </Form>
    </AuthGuestLayout>
  );
}
