import type { CSSProperties, ReactNode } from "react";
import { Card } from "antd";
import { CardSkeleton } from "@/components/ui/loading/CardSkeleton";
import { LoadingOverlay } from "@/components/ui/loading/LoadingOverlay";

export type PageLayoutProps = {
  children: ReactNode;
  style?: CSSProperties;
  /** First paint — replaces children with CardSkeleton. */
  loading?: boolean;
  /** Dim children while refreshing (keeps header visible). */
  overlay?: boolean;
};

/** Page shell (white panel) inside AppLayout content. */
export function PageLayout({
  children,
  style,
  loading = false,
  overlay = false,
}: PageLayoutProps) {
  if (loading) {
    return <CardSkeleton />;
  }

  return (
    <Card bordered={false} style={style}>
      <LoadingOverlay spinning={overlay}>{children}</LoadingOverlay>
    </Card>
  );
}
