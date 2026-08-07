import type { ReactNode } from "react";
import { AppButton } from "@/components/ui/button/AppButton";
import type { AppButtonProps } from "@/components/ui/button/AppButton";

export type ResetButtonProps = Omit<AppButtonProps, "children" | "htmlType"> & {
  children?: ReactNode;
};

/** Clear filters in a SearchForm toolbar. */
export function ResetButton({
  children = "Đặt lại",
  ...buttonProps
}: ResetButtonProps) {
  return (
    <AppButton htmlType="button" {...buttonProps}>
      {children}
    </AppButton>
  );
}
