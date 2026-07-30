import { Popconfirm } from "antd";
import type { PopconfirmProps } from "antd";

export type ConfirmPopconfirmProps = PopconfirmProps;

/** Shared confirm popup before destructive / important actions. */
export function ConfirmPopconfirm({
  okText = "Xác nhận",
  cancelText = "Hủy",
  children,
  ...popconfirmProps
}: ConfirmPopconfirmProps) {
  return (
    <Popconfirm okText={okText} cancelText={cancelText} {...popconfirmProps}>
      {children}
    </Popconfirm>
  );
}
