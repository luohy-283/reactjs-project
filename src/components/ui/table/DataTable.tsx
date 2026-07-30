import { useState } from "react";
import type { ReactNode } from "react";
import { Table } from "antd";
import type { ColumnType, ColumnsType, TableProps } from "antd/es/table";
import { LOADING_TIP } from "@/components/ui/loading/LoadingSpinner";
import { NoData } from "@/components/ui/empty/NoData";
import { TableSkeleton } from "@/components/ui/table/TableSkeleton";
import { TableToolbar } from "@/components/ui/table/TableToolbar";
import { DEFAULT_PAGE_SIZE, TABLE_PAGINATION } from "@/lib/pagination";

export type DataTableProps<T extends object> = Omit<
  TableProps<T>,
  "pagination" | "dataSource" | "loading"
> & {
  /** Prefer this alias (company-style); falls back to `dataSource`. */
  data?: readonly T[];
  dataSource?: readonly T[];
  loading?: boolean;
  /** Prepend STT column with continuous numbering across pages. Default true. */
  showStt?: boolean;
  emptyText?: ReactNode;
  /** Optional bar rendered above the table. */
  toolbar?: ReactNode;
  toolbarExtra?: ReactNode;
  /**
   * First-load placeholder when `loading` and no rows.
   * Default true — set false to always use Spin overlay.
   */
  showSkeleton?: boolean;
  skeletonRows?: number;
};

function sttColumn<T>(page: number, pageSize: number): ColumnType<T> {
  return {
    title: "STT",
    key: "stt",
    width: 64,
    align: "center",
    render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
  };
}

/** Shared list table: client-side pagination + optional STT column. */
export function DataTable<T extends object>({
  columns,
  data,
  dataSource,
  loading = false,
  showStt = true,
  emptyText,
  toolbar,
  toolbarExtra,
  showSkeleton = true,
  skeletonRows,
  locale,
  ...tableProps
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const rows = (data ?? dataSource ?? []) as T[];
  const mergedColumns: ColumnsType<T> = showStt
    ? [sttColumn<T>(page, pageSize), ...(columns ?? [])]
    : (columns ?? []);

  const toolbarNode =
    toolbar || toolbarExtra ? (
      <TableToolbar extra={toolbarExtra}>{toolbar}</TableToolbar>
    ) : null;

  if (loading && rows.length === 0 && showSkeleton) {
    return (
      <>
        {toolbarNode}
        <TableSkeleton rows={skeletonRows} />
      </>
    );
  }

  return (
    <>
      {toolbarNode}
      <Table<T>
        {...tableProps}
        columns={mergedColumns}
        dataSource={rows}
        loading={
          loading
            ? { spinning: true, tip: LOADING_TIP }
            : false
        }
        locale={{
          ...locale,
          emptyText: emptyText ?? locale?.emptyText ?? <NoData />,
        }}
        pagination={{
          ...TABLE_PAGINATION,
          current: page,
          pageSize,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          },
        }}
      />
    </>
  );
}
