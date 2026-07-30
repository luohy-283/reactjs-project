import { Alert as AntAlert } from "antd";
import type { AlertProps as AntAlertProps } from "antd";

export type AlertProps = AntAlertProps;

/**
 * Shared inline alert (forms, soft notices).
 * Prefer `ErrorMessage` for error-only form/fetch soft failures;
 * prefer `Banner` for full-width page-top notices.
 */
export function Alert({ showIcon = true, ...props }: AlertProps) {
  return <AntAlert showIcon={showIcon} {...props} />;
}
