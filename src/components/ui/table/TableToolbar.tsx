import type { CSSProperties, ReactNode } from "react";

export type TableToolbarProps = {
  /** Left side (filters already in PageHeader — use for secondary controls). */
  children?: ReactNode;
  /** Right side actions (refresh, export, …). */
  extra?: ReactNode;
  style?: CSSProperties;
};

/** Optional bar directly above a DataTable. */
export function TableToolbar({ children, extra, style }: TableToolbarProps) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 16,
        ...style,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, flex: 1 }}>
        {children}
      </div>
      {extra ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
          }}
        >
          {extra}
        </div>
      ) : null}
    </div>
  );
}

/** Company checklist name — same implementation as `TableToolbar`. */
export const Toolbar = TableToolbar;
export type ToolbarProps = TableToolbarProps;
