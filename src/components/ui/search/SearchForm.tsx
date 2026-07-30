import type { ReactNode } from "react";
import { Space } from "antd";
import { FilterPanel } from "@/components/ui/search/FilterPanel";
import { ResetButton } from "@/components/ui/search/ResetButton";
import { SearchButton } from "@/components/ui/search/SearchButton";

export type SearchFormProps = {
  children: ReactNode;
  /** Clears all filters in the parent page. */
  onReset?: () => void;
  /**
   * Apply filters. When set, shows SearchButton.
   * Omit for live-on-type search (only Reset is enough).
   */
  onSearch?: () => void;
  resetText?: string;
  searchText?: string;
};

/**
 * Reusable search toolbar: filter fields + Reset (+ optional Search).
 * Parent owns filter state; this only lays out controls.
 */
export function SearchForm({
  children,
  onReset,
  onSearch,
  resetText,
  searchText,
}: SearchFormProps) {
  const showActions = Boolean(onReset || onSearch);

  return (
    <FilterPanel>
      {children}
      {showActions ? (
        <Space wrap>
          {onReset ? (
            <ResetButton onClick={onReset}>{resetText}</ResetButton>
          ) : null}
          {onSearch ? (
            <SearchButton onClick={onSearch}>{searchText}</SearchButton>
          ) : null}
        </Space>
      ) : null}
    </FilterPanel>
  );
}
