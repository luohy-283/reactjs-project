import type { CSSProperties, ReactNode } from "react";
import { Message } from "primereact/message";

export type AlertType = "success" | "info" | "warning" | "error";

export type AlertProps = {
  type?: AlertType;
  message?: ReactNode;
  description?: ReactNode;
  showIcon?: boolean;
  closable?: boolean;
  onClose?: () => void;
  action?: ReactNode;
  banner?: boolean;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
};

function toSeverity(
  type: AlertType | undefined,
): "success" | "info" | "warn" | "error" {
  if (type === "warning") return "warn";
  if (type === "success") return "success";
  if (type === "error") return "error";
  return "info";
}

/**
 * Shared inline alert (forms, soft notices).
 * Prefer `ErrorMessage` for error-only form/fetch soft failures;
 * prefer `Banner` for full-width page-top notices.
 */
export function Alert({
  type = "info",
  message,
  description,
  showIcon = true,
  closable,
  onClose,
  action,
  style,
  className,
  children,
}: AlertProps) {
  const content = (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
      {message ? <div style={{ fontWeight: 600 }}>{message}</div> : null}
      {description ? <div>{description}</div> : null}
      {children}
      {action ? <div style={{ marginTop: 8 }}>{action}</div> : null}
    </div>
  );

  return (
    <div style={{ position: "relative", ...style }} className={className}>
      <Message
        severity={toSeverity(type)}
        text={typeof message === "string" && !description && !action && !children ? message : undefined}
        content={!message || description || action || children ? content : undefined}
        icon={showIcon ? undefined : " "}
        style={{ width: "100%" }}
      />
      {closable ? (
        <button
          type="button"
          aria-label="Đóng"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          <i className="pi pi-times" />
        </button>
      ) : null}
    </div>
  );
}
