import type { ReactNode } from "react";
import { AppButton } from "@/components/ui/button/AppButton";
import type { AppButtonProps } from "@/components/ui/button/AppButton";

export type RetryButtonProps = Omit<AppButtonProps, "children" | "onClick"> & {
  children?: ReactNode;
  /** Prefer this over `onClick` for refetch handlers. */
  onRetry?: () => void;
  onClick?: AppButtonProps["onClick"];
};

/** Retry / refetch control — use with `ErrorMessage` action or `ErrorPage` extra. */
export function RetryButton({
  children = "Thử lại",
  onRetry,
  onClick,
  icon = "pi pi-refresh",
  type = "primary",
  ...buttonProps
}: RetryButtonProps) {
  return (
    <AppButton
      type={type}
      icon={icon}
      onClick={(e) => {
        onRetry?.();
        onClick?.(e);
      }}
      {...buttonProps}
    >
      {children}
    </AppButton>
  );
}
