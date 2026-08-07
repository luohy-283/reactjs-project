import type { ReactNode } from "react";
import { Button } from "primereact/button";
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "48px 16px",
        textAlign: "center",
      }}
    >
      <i
        className="pi pi-lock"
        style={{ fontSize: 40, color: "var(--p-orange-500, #f59e0b)" }}
      />
      <div style={{ fontSize: 20, fontWeight: 600 }}>{title}</div>
      <div style={{ color: "var(--p-text-muted-color, #6b7280)", maxWidth: 420 }}>
        {description}
      </div>
      {extra ?? (
        <Button
          type="button"
          label="Về Dashboard"
          onClick={() => navigate("/dashboard")}
        />
      )}
    </div>
  );
}
