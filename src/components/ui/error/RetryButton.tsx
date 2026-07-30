import type { ReactNode } from "react";
import { Button } from "antd";
import type { ButtonProps } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

export type RetryButtonProps = Omit<ButtonProps, "children" | "onClick"> & {
  children?: ReactNode;
  /** Prefer this over `onClick` for refetch handlers. */
  onRetry?: () => void;
  onClick?: ButtonProps["onClick"];
};

/** Retry / refetch control — use with `ErrorMessage` action or `ErrorPage` extra. */
export function RetryButton({
  children = "Thử lại",
  onRetry,
  onClick,
  icon = <ReloadOutlined />,
  type = "primary",
  ...buttonProps
}: RetryButtonProps) {
  return (
    <Button
      type={type}
      icon={icon}
      onClick={(e) => {
        onRetry?.();
        onClick?.(e);
      }}
      {...buttonProps}
    >
      {children}
    </Button>
  );
}
