import { FormModal } from "@/components/ui/dialog/FormModal";
import type { FormModalProps } from "@/components/ui/dialog/FormModal";

export type ViewDialogProps = FormModalProps;

/** Read-only dialog — single close button, no cancel. */
export function ViewDialog({
  okText = "Đóng",
  onOk,
  onCancel,
  ...modalProps
}: ViewDialogProps) {
  return (
    <FormModal
      okText={okText}
      cancelButtonProps={{ style: { display: "none" } }}
      onOk={onOk ?? onCancel}
      onCancel={onCancel}
      {...modalProps}
    />
  );
}
