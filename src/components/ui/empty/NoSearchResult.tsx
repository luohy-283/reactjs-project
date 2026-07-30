import type { ReactNode } from "react";
import { Button, Empty } from "antd";

export type NoSearchResultProps = {
  description?: ReactNode;
  /** Optional clear-filters action under the message. */
  onReset?: () => void;
  resetText?: string;
};

/** Empty state when filters/search yield zero rows but data may exist. */
export function NoSearchResult({
  description = "Không tìm thấy kết quả phù hợp",
  onReset,
  resetText = "Đặt lại bộ lọc",
}: NoSearchResultProps) {
  return (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description}>
      {onReset ? (
        <Button type="link" onClick={onReset}>
          {resetText}
        </Button>
      ) : null}
    </Empty>
  );
}
