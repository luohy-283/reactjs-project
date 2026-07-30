import { Skeleton } from "antd";

export type TableSkeletonProps = {
  /** Number of placeholder rows. Default 6. */
  rows?: number;
};

/** Placeholder for DataTable first load (no rows yet). */
export function TableSkeleton({ rows = 6 }: TableSkeletonProps) {
  return (
    <div style={{ padding: "8px 0" }} aria-busy="true" aria-label="Đang tải bảng">
      <Skeleton.Input active block style={{ marginBottom: 16, height: 32 }} />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton
          key={index}
          active
          title={false}
          paragraph={{ rows: 1, width: "100%" }}
          style={{ marginBottom: 12 }}
        />
      ))}
    </div>
  );
}
