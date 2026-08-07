import { useState, type FormEvent } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { useLocation, useNavigate } from "react-router";
import { ErrorMessage } from "@/components/ui/error/ErrorMessage";
import { useAuth } from "@/features/auth/context/AuthContext";

type LoginValues = { email: string; password: string };

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [values, setValues] = useState<LoginValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!values.email.trim()) next.email = "Vui lòng nhập email";
    if (!values.password) next.password = "Vui lòng nhập mật khẩu";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

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
    <div
      className="login-page"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: 16,
        boxSizing: "border-box",
        background: "#f0f2f5",
      }}
    >
      <Card title="Đăng nhập" style={{ width: "100%", maxWidth: 360 }}>
        <ErrorMessage message={errorMsg} style={{ marginBottom: 16 }} />
        <form onSubmit={(e) => void handleLogin(e)}>
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="login-email"
              style={{ display: "block", marginBottom: 6 }}
            >
              Email
            </label>
            <IconField iconPosition="left" style={{ width: "100%" }}>
              <InputIcon className="pi pi-user" />
              <InputText
                id="login-email"
                value={values.email}
                onChange={(e) =>
                  setValues((v) => ({ ...v, email: e.target.value }))
                }
                placeholder="Nhập email"
                className="w-full"
                style={{ width: "100%" }}
                autoComplete="username"
              />
            </IconField>
            {errors.email ? (
              <small style={{ color: "var(--p-red-500, #ef4444)" }}>
                {errors.email}
              </small>
            ) : null}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="login-password"
              style={{ display: "block", marginBottom: 6 }}
            >
              Mật khẩu
            </label>
            <Password
              inputId="login-password"
              value={values.password}
              onChange={(e) =>
                setValues((v) => ({ ...v, password: e.target.value }))
              }
              placeholder="Nhập mật khẩu"
              feedback={false}
              toggleMask
              className="w-full"
              inputClassName="w-full"
              style={{ width: "100%" }}
              inputStyle={{ width: "100%" }}
              autoComplete="current-password"
            />
            {errors.password ? (
              <small style={{ color: "var(--p-red-500, #ef4444)" }}>
                {errors.password}
              </small>
            ) : null}
          </div>

          <Button
            type="submit"
            label="Đăng nhập"
            loading={loading}
            className="w-full"
            style={{ width: "100%" }}
          />
        </form>
      </Card>
    </div>
  );
}
