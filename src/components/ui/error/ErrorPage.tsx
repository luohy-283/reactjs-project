import type { ReactNode } from "react";

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
        className="pi pi-times-circle"
        style={{ fontSize: 40, color: "var(--p-red-500, #ef4444)" }}
      />
      <div style={{ fontSize: 20, fontWeight: 600 }}>{title}</div>
      <div style={{ color: "var(--p-text-muted-color, #6b7280)", maxWidth: 420 }}>
        {description}
      </div>
      {extra}
    </div>
  );
}
