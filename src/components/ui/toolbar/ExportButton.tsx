import type { ReactNode } from "react";
import { AppButton } from "@/components/ui/button/AppButton";
import type { AppButtonProps } from "@/components/ui/button/AppButton";

export type ExportButtonProps = Omit<AppButtonProps, "children" | "icon"> & {
  children?: ReactNode;
  hideIcon?: boolean;
};

/**
 * Export trigger. Wire `onClick` to a real download API (e.g. CSV export).
 */
export function ExportButton({
  children = "Xuất",
  hideIcon = false,
  ...buttonProps
}: ExportButtonProps) {
  return (
    <AppButton
      icon={hideIcon ? undefined : "pi pi-download"}
      {...buttonProps}
    >
      {children}
    </AppButton>
  );
}
