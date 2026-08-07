import { useCallback, useContext } from "react";
import { confirmDialog } from "primereact/confirmdialog";
import { ToastContext } from "@/components/ui/feedback/ToastContext";

export type AppModalProps = {
  title?: string;
  content?: string;
  okText?: string;
};

/** Toast via PrimeReact Toast host in AppProvider. Also exported from `Toast.ts`. */
export function useToast() {
  const toastRef = useContext(ToastContext);

  const show = useCallback(
    (severity: "success" | "error" | "warn" | "info", content: string) => {
      toastRef?.current?.show({
        severity,
        summary:
          severity === "success"
            ? "Thành công"
            : severity === "error"
              ? "Lỗi"
              : severity === "warn"
                ? "Cảnh báo"
                : "Thông báo",
        detail: content,
        life: 3500,
      });
    },
    [toastRef],
  );

  return {
    success: (content: string) => show("success", content),
    error: (content: string) => show("error", content),
    warning: (content: string) => show("warn", content),
  };
}

/** Imperative info/warning/error dialogs (not form modals). */
export function useAppModal() {
  return {
    warning: (props: AppModalProps) =>
      confirmDialog({
        header: props.title ?? "Cảnh báo",
        message: props.content,
        icon: "pi pi-exclamation-triangle",
        acceptLabel: props.okText ?? "Đã hiểu",
        rejectClassName: "p-button-text p-button-secondary",
        rejectLabel: "Đóng",
        accept: () => undefined,
      }),
    error: (props: AppModalProps) =>
      confirmDialog({
        header: props.title ?? "Lỗi",
        message: props.content,
        icon: "pi pi-times-circle",
        acceptLabel: props.okText ?? "Đóng",
        rejectClassName: "hidden",
        accept: () => undefined,
      }),
  };
}
