import type { ReactNode } from "react";
import { Button } from "antd";
import type { ButtonProps } from "antd";

export type ResetButtonProps = Omit<ButtonProps, "children" | "htmlType"> & {
  children?: ReactNode;
};

/** Clear filters in a SearchForm toolbar. */
export function ResetButton({
  children = "Đặt lại",
  ...buttonProps
}: ResetButtonProps) {
  return (
    <Button htmlType="button" {...buttonProps}>
      {children}
    </Button>
  );
}
