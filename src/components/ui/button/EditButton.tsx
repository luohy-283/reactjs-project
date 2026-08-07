import type { ReactNode } from "react";
import { AppButton } from "@/components/ui/button/AppButton";
import type { AppButtonProps } from "@/components/ui/button/AppButton";

export type EditButtonProps = Omit<AppButtonProps, "children"> & {
  children?: ReactNode;
};

/** Compact table-row edit action (`size="small"` by default). */
export function EditButton({
  children = "Sửa",
  size = "small",
  ...buttonProps
}: EditButtonProps) {
  return (
    <AppButton size={size} {...buttonProps}>
      {children}
    </AppButton>
  );
}
