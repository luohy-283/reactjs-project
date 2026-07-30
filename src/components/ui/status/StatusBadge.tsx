import type { ReactNode } from "react";
import { Tag } from "antd";
import type { TagProps } from "antd";

type StatusKey = string | number | boolean;

export type StatusBadgeProps = Omit<TagProps, "children" | "color"> & {
  /** Prefer `label` for status text; `children` also works. */
  label?: ReactNode;
  children?: ReactNode;
  color?: TagProps["color"];
  /** Lookup key when using `colorMap` / `labelMap`. */
  status?: StatusKey;
  colorMap?: Partial<Record<string, TagProps["color"]>>;
  labelMap?: Partial<Record<string, ReactNode>>;
};

/** Shared status Tag — pass `color` + `label`, or `status` + optional maps. */
export function StatusBadge({
  label,
  children,
  color,
  status,
  colorMap,
  labelMap,
  ...tagProps
}: StatusBadgeProps) {
  const key = status === undefined ? undefined : String(status);
  const resolvedColor =
    color ?? (key !== undefined ? colorMap?.[key] : undefined);
  const resolvedLabel =
    label ??
    (key !== undefined ? labelMap?.[key] : undefined) ??
    children;

  return (
    <Tag color={resolvedColor} {...tagProps}>
      {resolvedLabel}
    </Tag>
  );
}
