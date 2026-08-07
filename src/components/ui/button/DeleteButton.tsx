import type { ReactNode } from "react";
import { AppButton } from "@/components/ui/button/AppButton";
import type { AppButtonProps } from "@/components/ui/button/AppButton";

export type DeleteButtonProps = Omit<AppButtonProps, "children" | "danger"> & {
  children?: ReactNode;
};

/** Compact table-row destructive action (`size="small"` + `danger`). */
export function DeleteButton({
  children = "Xóa",
  size = "small",
  ...buttonProps
}: DeleteButtonProps) {
  return (
    <AppButton danger size={size} {...buttonProps}>
      {children}
    </AppButton>
  );
}
