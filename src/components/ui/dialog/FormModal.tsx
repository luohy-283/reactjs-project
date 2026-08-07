import type { CSSProperties, ReactNode } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

export type FormModalProps = {
  open?: boolean;
  visible?: boolean;
  title?: ReactNode;
  children?: ReactNode;
  onOk?: () => void | Promise<void>;
  onCancel?: () => void;
  onHide?: () => void;
  confirmLoading?: boolean;
  okText?: string;
  cancelText?: string;
  /** Kept for API compat — Dialog unmounts children when hidden via `visible`. */
  destroyOnHidden?: boolean;
  width?: number | string;
  style?: CSSProperties;
  className?: string;
  footer?: ReactNode | null;
  /** When true, hide the cancel button (ViewDialog). */
  hideCancel?: boolean;
  cancelButtonProps?: { style?: CSSProperties; className?: string };
  okButtonProps?: { danger?: boolean; severity?: string; className?: string };
  closable?: boolean;
  modal?: boolean;
};

/** Shared form dialog — Ant-like `open`/`onCancel`/`onOk` mapped to Prime Dialog. */
export function FormModal({
  open,
  visible,
  title,
  children,
  onOk,
  onCancel,
  onHide,
  confirmLoading,
  okText = "OK",
  cancelText = "Hủy",
  width = 520,
  style,
  className,
  footer,
  hideCancel,
  cancelButtonProps,
  okButtonProps,
  closable = true,
  destroyOnHidden: _unusedDestroyOnHidden,
}: FormModalProps) {
  void _unusedDestroyOnHidden;  const isVisible = visible ?? open ?? false;
  const handleHide = () => {
    onHide?.();
    onCancel?.();
  };

  const cancelHidden =
    hideCancel || cancelButtonProps?.style?.display === "none";

  const defaultFooter = (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
      {cancelHidden ? null : (
        <Button
          type="button"
          label={cancelText}
          outlined
          onClick={handleHide}
          disabled={confirmLoading}
          className={cancelButtonProps?.className}
          style={cancelButtonProps?.style}
        />
      )}
      <Button
        type="button"
        label={okText}
        loading={confirmLoading}
        severity={okButtonProps?.danger ? "danger" : undefined}
        className={okButtonProps?.className}
        onClick={() => void onOk?.()}
      />
    </div>
  );

  return (
    <Dialog
      header={title}
      visible={isVisible}
      onHide={handleHide}
      style={{ width: typeof width === "number" ? `${width}px` : width, ...style }}
      className={className}
      footer={footer === undefined ? defaultFooter : footer}
      closable={closable}
      dismissableMask={!confirmLoading}
      blockScroll
    >
      {children}
    </Dialog>
  );
}
