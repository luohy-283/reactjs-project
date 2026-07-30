import { Alert as AntAlert } from "antd";
import type { AlertProps as AntAlertProps } from "antd";

export type BannerProps = Omit<AntAlertProps, "banner"> & {
  /** Defaults to `info`. */
  type?: AntAlertProps["type"];
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
    <AntAlert
      banner
      type={type}
      showIcon={showIcon}
      style={{ marginBottom: 16, ...style }}
      {...props}
    />
  );
}
