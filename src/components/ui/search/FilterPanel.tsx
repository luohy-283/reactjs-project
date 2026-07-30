import type { CSSProperties, ReactNode } from "react";

export type FilterPanelProps = {
  children: ReactNode;
  style?: CSSProperties;
};

/** Flex wrap container for filter fields inside SearchForm / PageHeader. */
export function FilterPanel({ children, style }: FilterPanelProps) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
        gap: 12,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
