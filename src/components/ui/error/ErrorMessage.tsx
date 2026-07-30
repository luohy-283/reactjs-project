import type { ReactNode } from "react";
import { Alert } from "@/components/ui/feedback/Alert";
import type { AlertProps } from "@/components/ui/feedback/Alert";

export type ErrorMessageProps = {
  message?: ReactNode;
  description?: ReactNode;
  /** e.g. `<RetryButton onRetry={refetch} />` */
  action?: ReactNode;
  showIcon?: boolean;
  closable?: boolean;
  onClose?: AlertProps["onClose"];
  style?: AlertProps["style"];
  className?: string;
};

/** Inline / soft error (forms, login). Built on shared `Alert`. */
export function ErrorMessage({
  message,
  description,
  action,
  showIcon = true,
  closable,
  onClose,
  style,
  className,
}: ErrorMessageProps) {
  if (!message && !description) return null;

  return (
    <Alert
      type="error"
      showIcon={showIcon}
      message={message}
      description={description}
      action={action}
      closable={closable}
      onClose={onClose}
      style={style}
      className={className}
    />
  );
}
