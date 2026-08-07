import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { Button } from "primereact/button";
import type { ButtonProps as PrimeButtonProps } from "primereact/button";

/** Ant-compatible button surface used by shared UI wrappers. */
export type AppButtonProps = {
  children?: ReactNode;
  label?: string;
  /** Ant Design `type` — mapped onto Prime `text` / `outlined` / default. */
  type?: "primary" | "default" | "dashed" | "link" | "text";
  size?: "small" | "middle" | "large";
  danger?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode | string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  style?: CSSProperties;
  htmlType?: "button" | "submit" | "reset";
  title?: string;
  "aria-label"?: string;
  text?: boolean;
  outlined?: boolean;
  severity?: PrimeButtonProps["severity"];
  rounded?: boolean;
};

function mapSize(
  size: AppButtonProps["size"],
): PrimeButtonProps["size"] | undefined {
  if (size === "small") return "small";
  if (size === "large") return "large";
  return undefined;
}

/** Shared Prime Button with Ant-like `type` / `danger` / `size` props. */
export function AppButton({
  children,
  label,
  type = "default",
  size = "middle",
  danger,
  loading,
  disabled,
  icon,
  onClick,
  className,
  style,
  htmlType = "button",
  title,
  text,
  outlined,
  severity,
  rounded,
  ...rest
}: AppButtonProps) {
  const isText = Boolean(text) || type === "text" || type === "link";
  const isOutlined =
    Boolean(outlined) ||
    (!isText && type !== "primary" && (type === "default" || type === "dashed"));
  const resolvedSeverity =
    severity ?? (danger ? "danger" : type === "link" ? "secondary" : undefined);

  const stringLabel =
    label ?? (typeof children === "string" ? children : undefined);
  const nodeChildren = typeof children === "string" ? null : children;
  const iconProp = typeof icon === "string" ? icon : undefined;

  return (
    <Button
      type={htmlType}
      label={stringLabel}
      icon={iconProp}
      loading={loading}
      disabled={disabled}
      size={mapSize(size)}
      text={isText}
      outlined={isOutlined}
      severity={resolvedSeverity}
      rounded={rounded}
      onClick={onClick}
      className={className}
      style={style}
      title={title}
      aria-label={rest["aria-label"]}
    >
      {typeof icon !== "string" && icon != null ? icon : null}
      {nodeChildren}
    </Button>
  );
}
