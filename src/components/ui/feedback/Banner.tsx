import type { CSSProperties, ReactNode } from "react";
import { Alert, type AlertType } from "@/components/ui/feedback/Alert";

export type BannerProps = {
  type?: AlertType;
  message?: ReactNode;
  description?: ReactNode;
  showIcon?: boolean;
  closable?: boolean;
  onClose?: () => void;
  action?: ReactNode;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
};

/**
 * Full-width page-level notice for the top of `PageContent`.
 * For hard load failures with retry, prefer `ErrorPage` + `RetryButton`.
 */
export function Banner({
  type = "info",
  showIcon = true,
  style,
  ...props
}: BannerProps) {
  return (
    <Alert
      type={type}
      showIcon={showIcon}
      banner
      style={{ marginBottom: 16, ...style }}
      {...props}
    />
  );
}
