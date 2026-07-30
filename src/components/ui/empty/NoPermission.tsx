import type { ReactNode } from "react";
import { Button, Result } from "antd";
import { useNavigate } from "react-router";

export type NoPermissionProps = {
  title?: ReactNode;
  description?: ReactNode;
  /** Override default “Về Dashboard” action. */
  extra?: ReactNode;
};

/** Shown when the signed-in user lacks role access (e.g. USER → admin routes). */
export function NoPermission({
  title = "Không có quyền truy cập",
  description = "Tài khoản của bạn không được phép xem trang này.",
  extra,
}: NoPermissionProps) {
  const navigate = useNavigate();

  return (
    <Result
      status="403"
      title={title}
      subTitle={description}
      extra={
        extra ?? (
          <Button type="primary" onClick={() => navigate("/dashboard")}>
            Về Dashboard
          </Button>
        )
      }
    />
  );
}
