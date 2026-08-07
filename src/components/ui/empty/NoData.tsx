import type { ReactNode } from "react";

export type NoDataProps = {
  description?: ReactNode;
  children?: ReactNode;
};

/** Generic empty list / section — no records at all. */
export function NoData({
  description = "Không có dữ liệu",
  children,
}: NoDataProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "24px 12px",
        color: "var(--p-text-muted-color, #6b7280)",
        textAlign: "center",
      }}
    >
      <i className="pi pi-inbox" style={{ fontSize: 28, opacity: 0.55 }} />
      <div>{description}</div>
      {children}
    </div>
  );
}
