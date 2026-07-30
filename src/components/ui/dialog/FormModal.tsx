import { Modal } from "antd";
import type { ModalProps } from "antd";

export type FormModalProps = ModalProps;

/** Shared form dialog — consistent cancel label + destroy on close. */
export function FormModal({
  cancelText = "Hủy",
  destroyOnHidden = true,
  children,
  ...modalProps
}: FormModalProps) {
  return (
    <Modal cancelText={cancelText} destroyOnHidden={destroyOnHidden} {...modalProps}>
      {children}
    </Modal>
  );
}
