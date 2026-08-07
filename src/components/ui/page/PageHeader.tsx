import type { ReactNode } from "react";

export type PageHeaderProps = {
  title: ReactNode;
  /** Right-side actions (buttons, etc.) */
  extra?: ReactNode;
  /** Optional block under the title row (filters, search, …) */
  children?: ReactNode;
};

/** Page title row + optional toolbar / filter slot. */
export function PageHeader({ title, extra, children }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, lineHeight: 1.3 }}>
          {title}
        </h2>
        {extra ? <div>{extra}</div> : null}
      </div>
      {children ? <div style={{ marginTop: 16 }}>{children}</div> : null}
    </div>
  );
}
