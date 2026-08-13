import { useCallback, useState } from "react";
import {
  DEFAULT_PAGE_SIZE,
  toPageParams,
  type PageParams,
  type SortParam,
  type TableQuery,
} from "@/lib/pagination";

/** Shared Ant Design table query state → Spring `page`/`size`/`sort`. */
export function useServerTableQuery(initialSort?: SortParam) {
  const [query, setQuery] = useState<TableQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    sort: initialSort,
  });

  const pageParams: PageParams = toPageParams(query);

  const resetPage = useCallback(() => {
    setQuery((prev) => ({ ...prev, page: 1 }));
  }, []);

  const resetQuery = useCallback(
    (sort = initialSort) => {
      setQuery({
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        sort,
      });
    },
    [initialSort],
  );

  return { query, setQuery, pageParams, resetPage, resetQuery };
}
