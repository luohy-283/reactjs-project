import type { ReactNode } from "react";
import { Result } from "antd";

export type ErrorPageProps = {
  title?: ReactNode;
  description?: ReactNode;
  /** Override default empty extra — typically `<RetryButton onRetry={…} />`. */
  extra?: ReactNode;
};

/** Full-section load failure (list/schedule pages). Pair with `RetryButton`. */
export function ErrorPage({
  title = "Đã xảy ra lỗi",
  description = "Không tải được dữ liệu. Vui lòng thử lại.",
  extra,
}: ErrorPageProps) {
  return (
    <Result status="error" title={title} subTitle={description} extra={extra} />
  );
}
