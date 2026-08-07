import type { ReactNode } from "react";
import { Button } from "primereact/button";

export type NoSearchResultProps = {
  description?: ReactNode;
  /** Optional clear-filters action under the message. */
  onReset?: () => void;
  resetText?: string;
};

/** Empty state when filters/search yield zero rows but data may exist. */
export function NoSearchResult({
  description = "Không tìm thấy kết quả phù hợp",
  onReset,
  resetText = "Đặt lại bộ lọc",
}: NoSearchResultProps) {
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
      <i className="pi pi-search" style={{ fontSize: 28, opacity: 0.55 }} />
      <div>{description}</div>
      {onReset ? (
        <Button type="button" label={resetText} link onClick={onReset} />
      ) : null}
    </div>
  );
}
