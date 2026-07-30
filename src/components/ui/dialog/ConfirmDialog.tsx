import type { ReactNode } from "react";
import { Modal } from "antd";

export type ConfirmDialogProps = {
  open: boolean;
  title: ReactNode;
  content?: ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmLoading?: boolean;
  okText?: string;
  cancelText?: string;
  /** Styles OK as danger (delete / reject). */
  danger?: boolean;
  width?: number | string;
};

/** Modal confirm — use for page-level confirms; prefer ConfirmPopconfirm in table rows. */
export function ConfirmDialog({
  open,
  title,
  content,
  onConfirm,
  onCancel,
  confirmLoading,
  okText = "Xác nhận",
  cancelText = "Hủy",
  danger = false,
  width,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      onOk={onConfirm}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      okText={okText}
      cancelText={cancelText}
      okButtonProps={danger ? { danger: true } : undefined}
      destroyOnHidden
      width={width}
    >
      {content}
    </Modal>
  );
}
