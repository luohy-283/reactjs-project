import { ConfirmDialog } from "@/components/ui/dialog/ConfirmDialog";
import type { ConfirmDialogProps } from "@/components/ui/dialog/ConfirmDialog";

export type DeleteDialogProps = Omit<ConfirmDialogProps, "danger" | "okText"> & {
  okText?: string;
};

/** ConfirmDialog preset for delete / deactivate / destructive actions. */
export function DeleteDialog({
  okText = "Xóa",
  title = "Xác nhận xóa",
  ...props
}: DeleteDialogProps) {
  return <ConfirmDialog danger title={title} okText={okText} {...props} />;
}
