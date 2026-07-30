import type { ReactNode } from "react";
import { Spin } from "antd";
import { LOADING_TIP } from "@/components/ui/loading/LoadingSpinner";

export type LoadingOverlayProps = {
  spinning?: boolean;
  tip?: string;
  children: ReactNode;
  /** Min height so overlay has room while content is empty. */
  minHeight?: number | string;
};

/** Wraps children and dims them while spinning. */
export function LoadingOverlay({
  spinning = false,
  tip = LOADING_TIP,
  children,
  minHeight,
}: LoadingOverlayProps) {
  return (
    <Spin spinning={spinning} tip={tip}>
      <div style={minHeight != null ? { minHeight } : undefined}>{children}</div>
    </Spin>
  );
}
