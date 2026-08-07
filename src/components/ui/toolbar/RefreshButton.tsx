import type { ReactNode } from "react";
import { AppButton } from "@/components/ui/button/AppButton";
import type { AppButtonProps } from "@/components/ui/button/AppButton";

export type RefreshButtonProps = Omit<AppButtonProps, "children" | "icon"> & {
  children?: ReactNode;
  /** Hide the reload icon. */
  hideIcon?: boolean;
};

/** Reload list data (wire to hook `refetch`). */
export function RefreshButton({
  children = "Làm mới",
  hideIcon = false,
  ...buttonProps
}: RefreshButtonProps) {
  return (
    <AppButton
      icon={hideIcon ? undefined : "pi pi-refresh"}
      {...buttonProps}
    >
      {children}
    </AppButton>
  );
}
