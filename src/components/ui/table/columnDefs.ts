import type { ColumnType, ColumnsType } from "antd/es/table";

/** Alias matching common company naming for Ant Design column configs. */
export type ColumnDefs<T> = ColumnsType<T>;
export type ColumnDef<T> = ColumnType<T>;

/** Identity helper — keeps column arrays typed without a separate factory lib. */
export function defineColumns<T extends object>(
  columns: ColumnsType<T>,
): ColumnsType<T> {
  return columns;
}

/**
 * Enable header click sort (`sorter: true` — parent/API handles ordering).
 * Omit this helper to keep the column non-sortable.
 * `sortField` = Spring property when it differs from `dataIndex` / `key`.
 */
export function sortableColumn<T extends object>(
  column: ColumnType<T>,
  sortField?: string,
): ColumnType<T> {
  const field =
    sortField ??
    (typeof column.dataIndex === "string" ? column.dataIndex : undefined) ??
    (typeof column.key === "string" ? column.key : undefined);

  return {
    ...column,
    key: column.key ?? field,
    sorter: true,
    showSorterTooltip: true,
  };
}

/** Standard "Thao tác" column shell; pass render via TableRowActions in the page. */
export function actionsColumn<T extends object>(
  render: NonNullable<ColumnType<T>["render"]>,
  overrides?: Partial<ColumnType<T>>,
): ColumnType<T> {
  return {
    title: "Thao tác",
    key: "actions",
    fixed: "right",
    ...overrides,
    render,
  };
}
