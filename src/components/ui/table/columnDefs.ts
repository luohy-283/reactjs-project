import type { CSSProperties, ReactNode } from "react";

/**
 * Column config accepted by `DataTable`.
 * Keeps Ant-style `title` / `dataIndex` / `render` so feature pages compile
 * while mapping to PrimeReact Column (`header` / `field` / `body`).
 */
export type ColumnDef<T extends object> = {
  title?: ReactNode;
  header?: ReactNode;
  dataIndex?: string | keyof T;
  field?: string;
  key?: string;
  /** Ant-style cell renderer `(value, record, index)`. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (value: any, record: T, index: number) => ReactNode;
  /** Prime-style body `(rowData, options)`. */
  body?: (
    rowData: T,
    options: { rowIndex: number; field?: string },
  ) => ReactNode;
  sortable?: boolean;
  /** Ant alias — treated like `sortable: true`. */
  sorter?: boolean | ((a: T, b: T) => number);
  width?: number | string;
  style?: CSSProperties;
  align?: "left" | "right" | "center";
  fixed?: "left" | "right";
  /** Ant alias — ignored visually for now (CSS ellipsis can be added later). */
  ellipsis?: boolean | { showTitle?: boolean };
  className?: string;
  headerClassName?: string;
  bodyClassName?: string | ((data: T) => string);
};

export type ColumnDefs<T extends object> = ColumnDef<T>[];

/** Identity helper — keeps column arrays typed without a separate factory lib. */
export function defineColumns<T extends object>(
  columns: ColumnDefs<T>,
): ColumnDefs<T> {
  return columns;
}

/**
 * Enable header click sort (parent/API handles ordering).
 * Omit this helper to keep the column non-sortable.
 * `sortField` = Spring property when it differs from `dataIndex` / `key`.
 */
export function sortableColumn<T extends object>(
  column: ColumnDef<T>,
  sortField?: string,
): ColumnDef<T> {
  const field =
    sortField ??
    (typeof column.dataIndex === "string" ? column.dataIndex : undefined) ??
    (typeof column.field === "string" ? column.field : undefined) ??
    (typeof column.key === "string" ? column.key : undefined);

  return {
    ...column,
    key: column.key ?? field,
    field: column.field ?? field,
    sortable: true,
  };
}

/** Standard "Thao tác" column shell; pass render via TableRowActions in the page. */
export function actionsColumn<T extends object>(
  render: NonNullable<ColumnDef<T>["render"]>,
  overrides?: Partial<ColumnDef<T>>,
): ColumnDef<T> {
  return {
    title: "Thao tác",
    key: "actions",
    ...overrides,
    render,
  };
}

/** Resolve the Prime `field` string from a column def. */
export function columnField<T extends object>(
  column: ColumnDef<T>,
): string | undefined {
  if (typeof column.field === "string") return column.field;
  if (typeof column.dataIndex === "string") return column.dataIndex;
  if (typeof column.key === "string") return column.key;
  return undefined;
}

function readFieldValue<T extends object>(
  record: T,
  field: string | undefined,
): unknown {
  if (!field) return undefined;
  return (record as Record<string, unknown>)[field];
}

/** Build Prime Column `body` from Ant `render` or Prime `body`. */
export function columnBody<T extends object>(
  column: ColumnDef<T>,
):
  | ((rowData: T, options: { rowIndex: number }) => ReactNode)
  | undefined {
  const field = columnField(column);
  if (column.body) {
    return (rowData, options) =>
      column.body!(rowData, { ...options, field });
  }
  if (column.render) {
    return (rowData, options) =>
      column.render!(readFieldValue(rowData, field), rowData, options.rowIndex);
  }
  return undefined;
}
