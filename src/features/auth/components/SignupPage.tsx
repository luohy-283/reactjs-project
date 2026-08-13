import { useState } from "react";
import { Form, Input, Button, Typography } from "antd";
import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router";
import { ErrorMessage } from "@/components/ui/error/ErrorMessage";
import { AuthGuestLayout } from "@/features/auth/components/AuthGuestLayout";
import { useAuth } from "@/features/auth/context/AuthContext";

type SignupFormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleSignup = async (values: SignupFormValues) => {
    setLoading(true);
    setErrorMsg("");

    try {
      await signup({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuestLayout
      title="Đăng ký"
      footer={
        <Typography.Paragraph style={{ marginBottom: 0, textAlign: "center" }}>
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </Typography.Paragraph>
      }
    >
      <ErrorMessage message={errorMsg} style={{ marginBottom: 16 }} />
      <Form layout="vertical" onFinish={handleSignup}>
        <Form.Item
          label="Họ tên"
          name="fullName"
          rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Nhập họ tên" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Vui lòng nhập email" },
            { type: "email", message: "Email không hợp lệ" },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="Nhập email" />
        </Form.Item>

        <Form.Item
          label="Mật khẩu"
          name="password"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu" },
            { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Nhập mật khẩu"
          />
        </Form.Item>

        <Form.Item
          label="Xác nhận mật khẩu"
          name="confirmPassword"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Vui lòng xác nhận mật khẩu" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("Mật khẩu xác nhận không khớp"),
                );
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Nhập lại mật khẩu"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Đăng ký
          </Button>
        </Form.Item>
      </Form>
    </AuthGuestLayout>
  );
}
