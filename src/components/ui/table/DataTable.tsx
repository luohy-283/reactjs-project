import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Column } from "primereact/column";
import {
  DataTable as PrimeDataTable,
  type DataTablePageEvent,
  type DataTableSortEvent,
  type DataTableRowClickEvent,
} from "primereact/datatable";
import { ProgressSpinner } from "primereact/progressspinner";
import { NoData } from "@/components/ui/empty/NoData";
import { TableSkeleton } from "@/components/ui/table/TableSkeleton";
import { TableToolbar } from "@/components/ui/table/TableToolbar";
import {
  columnBody,
  columnField,
  type ColumnDef,
  type ColumnDefs,
} from "@/components/ui/table/columnDefs";
import {
  DEFAULT_PAGE_SIZE,
  parseSortParam,
  toSortParam,
  type TableQuery,
} from "@/lib/pagination";

export type { TableQuery };

type RowHandlers = {
  onClick?: (event: unknown) => void;
};

export type DataTableProps<T extends object> = {
  columns?: ColumnDefs<T>;
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
   * Default true — set false to always use spinner overlay.
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
  /** 1-based page. Controlled when `serverSide`. */
  page?: number;
  pageSize?: number;
  /** Spring sort string, e.g. `startTime,desc`. Controlled when `serverSide`. */
  sort?: string;
  /** Fires on page/sort change when `serverSide`. */
  onQueryChange?: (query: TableQuery) => void;
  /** Ant alias for Prime `dataKey`. */
  rowKey?: string | ((record: T) => string);
  dataKey?: string;
  rowClassName?: string | ((data: T) => string);
  /** Ant-style row props factory — `onClick` is mapped to `onRowClick`. */
  onRow?: (record: T) => RowHandlers;
  className?: string;
  style?: CSSProperties;
  /** Kept for API compat; sticky header via scrollable when set. */
  sticky?: boolean | { offsetHeader?: number };
  /**
   * Ant Design `scroll` alias — `{ x }` enables horizontal scroll;
   * `{ y }` maps to Prime `scrollHeight`.
   */
  scroll?: { x?: number | string | true; y?: number | string };
  scrollHeight?: string;
  size?: "small" | "normal" | "large";
};

function sttColumn<T extends object>(
  page: number,
  pageSize: number,
): ColumnDef<T> {
  return {
    title: "STT",
    key: "stt",
    width: 64,
    align: "center",
    body: (_row, { rowIndex }) => (page - 1) * pageSize + rowIndex + 1,
  };
}

function resolveDataKey<T extends object>(
  rowKey: DataTableProps<T>["rowKey"],
  dataKey: string | undefined,
): string | undefined {
  if (typeof dataKey === "string") return dataKey;
  if (typeof rowKey === "string") return rowKey;
  return undefined;
}

function resolveRowClassName<T extends object>(
  rowClassName: DataTableProps<T>["rowClassName"],
  data: T,
): string | undefined {
  if (typeof rowClassName === "function") return rowClassName(data) || undefined;
  return rowClassName;
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
  serverSide = false,
  total = 0,
  page: pageProp,
  pageSize: pageSizeProp,
  sort,
  onQueryChange,
  rowKey,
  dataKey: dataKeyProp,
  rowClassName,
  onRow,
  className,
  style,
  scroll,
  scrollHeight,
  size = "small",
}: DataTableProps<T>) {
  const [clientPage, setClientPage] = useState(1);
  const [clientPageSize, setClientPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [clientSort, setClientSort] = useState<string | undefined>();

  const page = serverSide ? (pageProp ?? 1) : clientPage;
  const pageSize = serverSide
    ? (pageSizeProp ?? DEFAULT_PAGE_SIZE)
    : clientPageSize;
  const activeSort = serverSide ? sort : clientSort;
  const parsedSort = parseSortParam(activeSort);

  const rows = (data ?? dataSource ?? []) as T[];
  const baseColumns = (columns ?? []) as ColumnDefs<T>;
  const mergedColumns: ColumnDefs<T> = showStt
    ? [sttColumn<T>(page, pageSize), ...baseColumns]
    : baseColumns;

  const dataKey = resolveDataKey(rowKey, dataKeyProp);

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

  const emitQuery = (next: TableQuery) => {
    if (serverSide) {
      onQueryChange?.(next);
      return;
    }
    setClientPage(next.page);
    setClientPageSize(next.pageSize);
    setClientSort(next.sort);
    onQueryChange?.(next);
  };

  const onPage = (event: DataTablePageEvent) => {
    const nextPage = Math.floor(event.first / event.rows) + 1;
    emitQuery({
      page: nextPage,
      pageSize: event.rows,
      sort: activeSort,
    });
  };

  const onSort = (event: DataTableSortEvent) => {
    const nextSort = toSortParam(
      typeof event.sortField === "string" ? event.sortField : undefined,
      event.sortOrder,
    );
    emitQuery({
      page: serverSide ? page : 1,
      pageSize,
      sort: nextSort,
    });
  };

  const onRowClick = (event: DataTableRowClickEvent) => {
    const handlers = onRow?.(event.data as T);
    handlers?.onClick?.(event.originalEvent);
  };

  const emptyMessage = emptyText ?? <NoData />;
  const resolvedScrollHeight =
    scrollHeight ??
    (scroll?.y != null
      ? typeof scroll.y === "number"
        ? `${scroll.y}px`
        : String(scroll.y)
      : undefined);
  const enableScroll = Boolean(resolvedScrollHeight || scroll?.x);

  return (
    <>
      {toolbarNode}
      <div
        style={{
          position: "relative",
          overflowX: scroll?.x ? "auto" : undefined,
          ...style,
        }}
        className={className}
      >
        {loading && rows.length > 0 ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "color-mix(in srgb, var(--p-content-background, #fff) 55%, transparent)",
            }}
          >
            <ProgressSpinner
              style={{ width: 40, height: 40 }}
              strokeWidth="4"
              aria-label="Đang tải"
            />
          </div>
        ) : null}
        <PrimeDataTable
          value={rows}
          dataKey={dataKey}
          lazy={serverSide}
          paginator
          rows={pageSize}
          first={(page - 1) * pageSize}
          totalRecords={serverSide ? total : rows.length}
          onPage={onPage}
          onSort={serverSide || onQueryChange ? onSort : undefined}
          sortMode="single"
          sortField={parsedSort?.field}
          sortOrder={parsedSort?.order}
          removableSort
          size={size}
          scrollable={enableScroll}
          scrollHeight={resolvedScrollHeight}
          emptyMessage={emptyMessage}
          rowClassName={(rowData) =>
            resolveRowClassName(rowClassName, rowData as T) ?? ""
          }
          onRowClick={onRow ? onRowClick : undefined}
          pt={
            dataKey
              ? {
                  bodyRow: (options) => {
                    const data = (
                      options as
                        | { context?: { data?: Record<string, unknown> } }
                        | undefined
                    )?.context?.data;
                    return {
                      "data-row-key": String(data?.[dataKey] ?? ""),
                    };
                  },
                }
              : undefined
          }
        >
          {mergedColumns.map((col, index) => {
            const field = columnField(col);
            const body = columnBody(col);
            const colKey = col.key ?? field ?? `col-${index}`;
            const width =
              typeof col.width === "number" ? `${col.width}px` : col.width;
            return (
              <Column
                key={colKey}
                field={field}
                header={col.header ?? col.title}
                body={body}
                sortable={Boolean(col.sortable ?? col.sorter)}
                style={{
                  width,
                  textAlign: col.align,
                  ...col.style,
                }}
                frozen={Boolean(col.fixed)}
                alignFrozen={col.fixed === "right" ? "right" : "left"}
                className={col.className}
                headerClassName={col.headerClassName}
                bodyClassName={
                  typeof col.bodyClassName === "function"
                    ? (data) =>
                        (col.bodyClassName as (d: T) => string)(data as T)
                    : col.bodyClassName
                }
              />
            );
          })}
        </PrimeDataTable>
      </div>
    </>
  );
}
