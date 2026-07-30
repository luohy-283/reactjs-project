import type { ReactNode } from "react";
import { NoData } from "@/components/ui/empty/NoData";

export type TableEmptyProps = {
  description?: ReactNode;
  children?: ReactNode;
};

/** @deprecated Prefer `NoData` — kept as DataTable default alias. */
export function TableEmpty({
  description = "Không có dữ liệu",
  children,
}: TableEmptyProps) {
  return <NoData description={description}>{children}</NoData>;
}
