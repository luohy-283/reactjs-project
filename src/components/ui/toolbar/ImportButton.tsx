import type { ReactNode } from "react";
import { AppButton } from "@/components/ui/button/AppButton";
import type { AppButtonProps } from "@/components/ui/button/AppButton";

export type ImportButtonProps = Omit<AppButtonProps, "children" | "icon"> & {
  children?: ReactNode;
  hideIcon?: boolean;
};

/**
 * Import trigger wrapper. Wire `onClick` / Upload only when a real import API exists.
 */
export function ImportButton({
  children = "Nhập",
  hideIcon = false,
  ...buttonProps
}: ImportButtonProps) {
  return (
    <AppButton
      icon={hideIcon ? undefined : "pi pi-upload"}
      {...buttonProps}
    >
      {children}
    </AppButton>
  );
}
