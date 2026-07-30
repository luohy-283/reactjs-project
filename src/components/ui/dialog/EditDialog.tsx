import { FormModal } from "@/components/ui/dialog/FormModal";
import type { FormModalProps } from "@/components/ui/dialog/FormModal";

export type EditDialogProps = FormModalProps;

/** Form modal preset for edit flows. */
export function EditDialog({
  okText = "Lưu",
  ...modalProps
}: EditDialogProps) {
  return <FormModal okText={okText} {...modalProps} />;
}
