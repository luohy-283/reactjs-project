import type { ReactNode } from "react";
import { ProgressSpinner } from "primereact/progressspinner";
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
    <div style={{ position: "relative", minHeight }}>
      <div
        style={{
          opacity: spinning ? 0.45 : 1,
          pointerEvents: spinning ? "none" : undefined,
          transition: "opacity 0.2s ease",
        }}
      >
        {children}
      </div>
      {spinning ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            zIndex: 2,
          }}
        >
          <ProgressSpinner
            style={{ width: 40, height: 40 }}
            strokeWidth="4"
            aria-label={tip}
          />
          {tip ? <span style={{ fontSize: 13 }}>{tip}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
