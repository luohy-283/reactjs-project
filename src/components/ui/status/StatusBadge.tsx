import type { ReactNode } from "react";
import { Tag } from "primereact/tag";

type StatusKey = string | number | boolean;

type TagSeverity =
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "secondary"
  | "contrast"
  | undefined;

const ANT_COLOR_TO_SEVERITY: Record<string, TagSeverity> = {
  green: "success",
  success: "success",
  blue: "info",
  processing: "info",
  cyan: "info",
  geekblue: "info",
  gold: "warning",
  orange: "warning",
  warning: "warning",
  red: "danger",
  error: "danger",
  volcano: "danger",
  magenta: "danger",
  default: "secondary",
  default_gray: "secondary",
};

function toSeverity(color: string | undefined): TagSeverity {
  if (!color) return undefined;
  return ANT_COLOR_TO_SEVERITY[color] ?? undefined;
}

export type StatusBadgeProps = {
  /** Prefer `label` for status text; `children` also works. */
  label?: ReactNode;
  children?: ReactNode;
  /** Ant Design Tag color name, or a CSS color string. */
  color?: string;
  /** Lookup key when using `colorMap` / `labelMap`. */
  status?: StatusKey;
  colorMap?: Partial<Record<string, string>>;
  labelMap?: Partial<Record<string, ReactNode>>;
  className?: string;
  style?: React.CSSProperties;
  rounded?: boolean;
};

/** Shared status Tag — pass `color` + `label`, or `status` + optional maps. */
export function StatusBadge({
  label,
  children,
  color,
  status,
  colorMap,
  labelMap,
  className,
  style,
  rounded,
}: StatusBadgeProps) {
  const key = status === undefined ? undefined : String(status);
  const resolvedColor =
    color ?? (key !== undefined ? colorMap?.[key] : undefined);
  const resolvedLabel =
    label ??
    (key !== undefined ? labelMap?.[key] : undefined) ??
    children;

  const severity = toSeverity(resolvedColor);
  const customStyle =
    resolvedColor && !severity
      ? {
          background: resolvedColor,
          color: "#fff",
          ...style,
        }
      : style;

  return (
    <Tag
      value={resolvedLabel as string | undefined}
      severity={severity}
      rounded={rounded}
      className={className}
      style={customStyle}
    >
      {typeof resolvedLabel !== "string" ? resolvedLabel : null}
    </Tag>
  );
}
