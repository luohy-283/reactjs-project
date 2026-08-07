import type { ReactNode } from "react";
import { AppButton } from "@/components/ui/button/AppButton";
import type { AppButtonProps } from "@/components/ui/button/AppButton";

export type SearchButtonProps = Omit<
  AppButtonProps,
  "children" | "htmlType" | "type"
> & {
  children?: ReactNode;
  type?: AppButtonProps["type"];
};

/** Apply filters (use when search is submit-driven, not live-on-type). */
export function SearchButton({
  children = "Tìm kiếm",
  type = "primary",
  ...buttonProps
}: SearchButtonProps) {
  return (
    <AppButton type={type} htmlType="button" {...buttonProps}>
      {children}
    </AppButton>
  );
}
