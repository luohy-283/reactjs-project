import type { CSSProperties, ReactNode } from "react";
import { ProgressSpinner } from "primereact/progressspinner";

export type LoadingSpinnerProps = {
  tip?: string;
  size?: "small" | "default" | "large";
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

const SIZE_PX: Record<NonNullable<LoadingSpinnerProps["size"]>, number> = {
  small: 24,
  default: 40,
  large: 56,
};

/** Inline / centered spinner. */
export function LoadingSpinner({
  tip = "Đang tải…",
  size = "default",
  className,
  style,
  children,
}: LoadingSpinnerProps) {
  const px = SIZE_PX[size];
  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        ...style,
      }}
    >
      <ProgressSpinner
        style={{ width: px, height: px }}
        strokeWidth="4"
        aria-label={tip}
      />
      {tip ? <span style={{ fontSize: 13, opacity: 0.75 }}>{tip}</span> : null}
      {children}
    </div>
  );
}

export const LOADING_TIP = "Đang tải…";
