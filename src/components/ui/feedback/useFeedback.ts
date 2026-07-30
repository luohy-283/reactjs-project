import { App } from "antd";
import type { ModalFuncProps } from "antd";

/** Toast via Ant Design App context (works with AppProvider). Also exported from `Toast.ts`. */
export function useToast() {
  const { message } = App.useApp();

  return {
    success: (content: string) => {
      void message.success(content);
    },
    error: (content: string) => {
      void message.error(content);
    },
    warning: (content: string) => {
      void message.warning(content);
    },
  };
}

/** Imperative info/warning/error dialogs (not form modals). */
export function useAppModal() {
  const { modal } = App.useApp();

  return {
    warning: (props: ModalFuncProps) =>
      modal.warning({
        okText: "Đã hiểu",
        ...props,
      }),
    error: (props: ModalFuncProps) =>
      modal.error({
        okText: "Đóng",
        ...props,
      }),
  };
}
