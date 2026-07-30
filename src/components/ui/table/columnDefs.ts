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

/** Standard "Thao tác" column shell; pass render via TableRowActions in the page. */
export function actionsColumn<T extends object>(
  render: NonNullable<ColumnType<T>["render"]>,
  overrides?: Partial<ColumnType<T>>,
): ColumnType<T> {
  return {
    title: "Thao tác",
    key: "actions",
    ...overrides,
    render,
  };
}
