import { useState } from "react";
import type { ReactNode } from "react";
import { Table } from "antd";
import type {
  ColumnType,
  ColumnsType,
  TableProps,
} from "antd/es/table";
import type { SorterResult } from "antd/es/table/interface";
import { HEADER_HEIGHT } from "@/components/layouts/Topbar";
import { LOADING_TIP } from "@/components/ui/loading/LoadingSpinner";
import { NoData } from "@/components/ui/empty/NoData";
import { TableSkeleton } from "@/components/ui/table/TableSkeleton";
import { TableToolbar } from "@/components/ui/table/TableToolbar";
import {
  DEFAULT_PAGE_SIZE,
  TABLE_PAGINATION,
  parseSortParam,
  toSortParam,
  type TableQuery,
} from "@/lib/pagination";

/** Sticky under the app Topbar; releases when the table scrolls out of view. */
const DEFAULT_STICKY: TableProps["sticky"] = { offsetHeader: HEADER_HEIGHT };

export type { TableQuery };

export type DataTableProps<T extends object> = Omit<
  TableProps<T>,
  "pagination" | "dataSource" | "loading" | "onChange"
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
  /**
   * Server-driven page/sort — parent fetches with Spring `page`/`size`/`sort`.
   * Default false = client-side pagination (legacy).
   */
  serverSide?: boolean;
  /** Required when `serverSide` — total rows from API. */
  total?: number;
  /** 1-based page (Ant Design). Controlled when `serverSide`. */
  page?: number;
  pageSize?: number;
  /** Spring sort string, e.g. `startTime,desc`. Controlled when `serverSide`. */
  sort?: string;
  /** Fires on page/sort change when `serverSide`. */
  onQueryChange?: (query: TableQuery) => void;
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

function sorterField<T>(sorter: SorterResult<T>): string | undefined {
  if (typeof sorter.field === "string") return sorter.field;
  if (Array.isArray(sorter.field)) return sorter.field.map(String).join(".");
  if (typeof sorter.columnKey === "string") return sorter.columnKey;
  return undefined;
}

function withSortOrder<T extends object>(
  columns: ColumnsType<T>,
  sort: string | undefined,
): ColumnsType<T> {
  const parsed = parseSortParam(sort);
  return columns.map((col) => {
    if (!("sorter" in col) || !col.sorter) return col;
    const dataIndex =
      "dataIndex" in col && typeof col.dataIndex === "string"
        ? col.dataIndex
        : undefined;
    const field =
      dataIndex ?? (typeof col.key === "string" ? col.key : undefined);
    const sortOrder =
      parsed && field === parsed.field ? parsed.order : null;
    return { ...col, sortOrder };
  });
}

/** Shared list table: client pagination by default; optional server page/sort. */
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
  sticky = DEFAULT_STICKY,
  serverSide = false,
  total = 0,
  page: pageProp,
  pageSize: pageSizeProp,
  sort,
  onQueryChange,
  ...tableProps
}: DataTableProps<T>) {
  const [clientPage, setClientPage] = useState(1);
  const [clientPageSize, setClientPageSize] = useState(DEFAULT_PAGE_SIZE);

  const page = serverSide ? (pageProp ?? 1) : clientPage;
  const pageSize = serverSide
    ? (pageSizeProp ?? DEFAULT_PAGE_SIZE)
    : clientPageSize;

  const rows = (data ?? dataSource ?? []) as T[];
  const baseColumns = (columns ?? []) as ColumnsType<T>;
  const orderedColumns = serverSide
    ? withSortOrder(baseColumns, sort)
    : baseColumns;
  const mergedColumns: ColumnsType<T> = showStt
    ? [sttColumn<T>(page, pageSize), ...orderedColumns]
    : orderedColumns;

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
        sticky={sticky}
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
          total: serverSide ? total : undefined,
          onChange: serverSide
            ? undefined
            : (nextPage, nextPageSize) => {
                setClientPage(nextPage);
                setClientPageSize(nextPageSize);
              },
        }}
        onChange={(pagination, _filters, sorter) => {
          if (!onQueryChange) return;
          const single = Array.isArray(sorter) ? sorter[0] : sorter;
          const nextSort = toSortParam(
            sorterField(single ?? {}),
            single?.order ?? null,
          );
          onQueryChange({
            page: serverSide ? (pagination.current ?? 1) : 1,
            pageSize: serverSide
              ? (pagination.pageSize ?? DEFAULT_PAGE_SIZE)
              : pageSize,
            sort: nextSort,
          });
        }}
      />
    </>
  );
}
