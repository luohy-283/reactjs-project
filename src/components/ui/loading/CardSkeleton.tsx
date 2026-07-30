import { Card, Skeleton } from "antd";

export type CardSkeletonProps = {
  /** Paragraph lines under the title placeholder. Default 4. */
  rows?: number;
  bordered?: boolean;
};

/** Placeholder for a page card / panel first paint. */
export function CardSkeleton({ rows = 4, bordered = false }: CardSkeletonProps) {
  return (
    <Card bordered={bordered} aria-busy="true" aria-label="Đang tải nội dung">
      <Skeleton active title={{ width: "40%" }} paragraph={{ rows }} />
    </Card>
  );
}
