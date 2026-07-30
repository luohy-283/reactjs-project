import type { ReactNode } from "react";
import { Button } from "antd";
import type { ButtonProps } from "antd";

export type ViewButtonProps = Omit<ButtonProps, "children"> & {
  children?: ReactNode;
};

/** Compact table-row view action (`size="small"` by default). */
export function ViewButton({
  children = "Xem",
  size = "small",
  ...buttonProps
}: ViewButtonProps) {
  return (
    <Button size={size} {...buttonProps}>
      {children}
    </Button>
  );
}
