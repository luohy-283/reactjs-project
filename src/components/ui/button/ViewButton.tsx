import type { ReactNode } from "react";
import { AppButton } from "@/components/ui/button/AppButton";
import type { AppButtonProps } from "@/components/ui/button/AppButton";

export type ViewButtonProps = Omit<AppButtonProps, "children"> & {
  children?: ReactNode;
};

/** Compact table-row view action (`size="small"` by default). */
export function ViewButton({
  children = "Xem",
  size = "small",
  ...buttonProps
}: ViewButtonProps) {
  return (
    <AppButton size={size} {...buttonProps}>
      {children}
    </AppButton>
  );
}
