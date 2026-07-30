import { Spin } from "antd";
import type { SpinProps } from "antd";

export type LoadingSpinnerProps = Omit<SpinProps, "spinning"> & {
  tip?: string;
};

/** Inline / centered spinner. */
export function LoadingSpinner({
  tip = "Đang tải…",
  size = "default",
  ...spinProps
}: LoadingSpinnerProps) {
  return <Spin tip={tip} size={size} {...spinProps} />;
}

export const LOADING_TIP = "Đang tải…";
