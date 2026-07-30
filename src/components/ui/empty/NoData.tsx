import type { ReactNode } from "react";
import { Empty } from "antd";

export type NoDataProps = {
  description?: ReactNode;
  children?: ReactNode;
};

/** Generic empty list / section — no records at all. */
export function NoData({
  description = "Không có dữ liệu",
  children,
}: NoDataProps) {
  return (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description}>
      {children}
    </Empty>
  );
}
