import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { confirmPopup, ConfirmPopup } from "primereact/confirmpopup";

export type ConfirmPopconfirmProps = {
  title?: ReactNode;
  description?: ReactNode;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
  okButtonProps?: { danger?: boolean };
  children?: ReactNode;
  disabled?: boolean;
};

/** Shared confirm popup before destructive / important actions. */
export function ConfirmPopconfirm({
  title,
  description,
  onConfirm,
  onCancel,
  okText = "Xác nhận",
  cancelText = "Hủy",
  okButtonProps,
  children,
  disabled,
}: ConfirmPopconfirmProps) {
  const popupKey = useId();

  const show = (event: MouseEvent) => {
    if (disabled) return;
    event.preventDefault();
    event.stopPropagation();
    const message =
      description != null ? (
        <div>
          {title ? <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div> : null}
          <div>{description}</div>
        </div>
      ) : (
        title
      );

    confirmPopup({
      target: event.currentTarget as HTMLElement,
      message: message as ReactNode,
      icon: "pi pi-exclamation-triangle",
      acceptLabel: okText,
      rejectLabel: cancelText,
      acceptClassName: okButtonProps?.danger ? "p-button-danger" : undefined,
      accept: () => {
        void onConfirm?.();
      },
      reject: () => {
        onCancel?.();
      },
    });
  };

  const child = Children.only(children);
  const trigger = isValidElement(child)
    ? cloneElement(child as ReactElement<{ onClick?: (e: MouseEvent) => void }>, {
        onClick: (e: MouseEvent) => {
          (child as ReactElement<{ onClick?: (e: MouseEvent) => void }>).props
            .onClick?.(e);
          show(e);
        },
      })
    : (
        <span onClick={show} style={{ display: "inline-flex" }}>
          {children}
        </span>
      );

  return (
    <>
      <ConfirmPopup key={popupKey} />
      {trigger}
    </>
  );
}
