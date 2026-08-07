import type { ReactNode } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

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
  width = 420,
}: ConfirmDialogProps) {
  const footer = (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
      <Button
        type="button"
        label={cancelText}
        outlined
        onClick={onCancel}
        disabled={confirmLoading}
      />
      <Button
        type="button"
        label={okText}
        loading={confirmLoading}
        severity={danger ? "danger" : undefined}
        onClick={() => void onConfirm()}
      />
    </div>
  );

  return (
    <Dialog
      header={title}
      visible={open}
      onHide={onCancel}
      style={{ width: typeof width === "number" ? `${width}px` : width }}
      footer={footer}
      dismissableMask={!confirmLoading}
      blockScroll
    >
      {content}
    </Dialog>
  );
}
