import type { ReactNode } from "react";
import { Button } from "antd";
import type { ButtonProps } from "antd";

export type SearchButtonProps = Omit<
  ButtonProps,
  "children" | "htmlType" | "type"
> & {
  children?: ReactNode;
  type?: ButtonProps["type"];
};

/** Apply filters (use when search is submit-driven, not live-on-type). */
export function SearchButton({
  children = "Tìm kiếm",
  type = "primary",
  ...buttonProps
}: SearchButtonProps) {
  return (
    <Button type={type} htmlType="button" {...buttonProps}>
      {children}
    </Button>
  );
}
