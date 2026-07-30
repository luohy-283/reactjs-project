import type { CSSProperties, ReactNode } from "react";

export type PageContentProps = {
  children: ReactNode;
  style?: CSSProperties;
};

/** Main body under PageHeader. */
export function PageContent({ children, style }: PageContentProps) {
  return <div style={style}>{children}</div>;
}
