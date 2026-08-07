import type { CSSProperties, ReactNode } from "react";

export type TableRowActionsProps = {
  children: ReactNode;
  size?: "small" | "middle" | "large";
  className?: string;
  style?: CSSProperties;
};

/** Horizontal action buttons inside a table actions column. */
export function TableRowActions({
  size = "small",
  children,
  className,
  style,
}: TableRowActionsProps) {
  const gap = size === "large" ? 12 : size === "middle" ? 8 : 6;
  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
