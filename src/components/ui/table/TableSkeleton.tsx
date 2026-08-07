import { Skeleton } from "primereact/skeleton";

export type TableSkeletonProps = {
  /** Number of placeholder rows. Default 6. */
  rows?: number;
};

/** Placeholder for DataTable first load (no rows yet). */
export function TableSkeleton({ rows = 6 }: TableSkeletonProps) {
  return (
    <div style={{ padding: "8px 0" }} aria-busy="true" aria-label="Đang tải bảng">
      <Skeleton width="100%" height="2rem" style={{ marginBottom: 16 }} />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton
          key={index}
          width="100%"
          height="1.25rem"
          style={{ marginBottom: 12 }}
        />
      ))}
    </div>
  );
}
