import { Skeleton } from "primereact/skeleton";

export type CardSkeletonProps = {
  /** Paragraph lines under the title placeholder. Default 4. */
  rows?: number;
  bordered?: boolean;
};

/** Placeholder for a page card / panel first paint. */
export function CardSkeleton({ rows = 4, bordered = false }: CardSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-label="Đang tải nội dung"
      style={{
        padding: 24,
        borderRadius: 8,
        background: "var(--p-content-background, #fff)",
        border: bordered
          ? "1px solid var(--p-content-border-color, #e5e7eb)"
          : undefined,
      }}
    >
      <Skeleton width="40%" height="1.5rem" className="mb-3" />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton
          key={index}
          width="100%"
          height="1rem"
          className="mb-2"
          style={{ marginBottom: 8 }}
        />
      ))}
    </div>
  );
}
