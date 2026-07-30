import { FormModal } from "@/components/ui/dialog/FormModal";
import type { FormModalProps } from "@/components/ui/dialog/FormModal";

export type CreateDialogProps = FormModalProps;

/** Form modal preset for create flows. */
export function CreateDialog({
  okText = "Thêm",
  ...modalProps
}: CreateDialogProps) {
  return <FormModal okText={okText} {...modalProps} />;
}
