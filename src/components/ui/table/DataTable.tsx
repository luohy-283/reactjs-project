import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type Key,
  type ReactNode,
} from "react";
import { Table } from "antd";
import type {
  ColumnType,
  ColumnsType,
  TableProps,
} from "antd/es/table";
import type { SorterResult } from "antd/es/table/interface";
import type {
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { LOADING_TIP } from "@/components/ui/loading/LoadingSpinner";
import { NoData } from "@/components/ui/empty/NoData";
import { TableSkeleton } from "@/components/ui/table/TableSkeleton";
import { TableToolbar } from "@/components/ui/table/TableToolbar";
import {
  ColumnSetting,
  type ColumnSettingOption,
} from "@/components/ui/toolbar/ColumnSetting";
import {
  DEFAULT_PAGE_SIZE,
  TABLE_PAGINATION,
  parseSortParams,
  toSortParam,
  type SortParam,
  type TableQuery,
} from "@/lib/pagination";

/** Sticky to the content scrollport (Topbar is outside it); releases when table leaves view. */
const DEFAULT_STICKY: TableProps["sticky"] = { offsetHeader: 0 };

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
  /** Spring sort string(s), e.g. `startTime,desc` or multi-sort list. Controlled when `serverSide`. */
  sort?: SortParam;
  /** Fires on page/sort change when `serverSide`. */
  onQueryChange?: (query: TableQuery) => void;
  /** Opt-in: ColumnSetting dropdown to show/hide columns. */
  enableColumnSetting?: boolean;
  /** Opt-in: checkbox row selection (uses `rowSelection` if passed, else internal state). */
  enableRowSelection?: boolean;
  /** Opt-in: drag-reorder columns via @dnd-kit (Ant Design drag-column pattern). */
  enableColumnDrag?: boolean;
  /** Opt-in: Ant Design multi-column sort → repeated Spring `sort=` params. */
  enableMultiSort?: boolean;
};

type KeyedColumn<T> = ColumnType<T> & { key: string };

function columnKey<T>(col: ColumnType<T>, index: number): string {
  if (typeof col.key === "string" || typeof col.key === "number") {
    return String(col.key);
  }
  if (typeof col.dataIndex === "string") return col.dataIndex;
  if (Array.isArray(col.dataIndex)) return col.dataIndex.map(String).join(".");
  return `col-${index}`;
}

function columnLabel<T>(col: ColumnType<T>, key: string): string {
  if (typeof col.title === "string" || typeof col.title === "number") {
    return String(col.title);
  }
  return key;
}

function asDataColumns<T extends object>(
  columns: ColumnsType<T> | undefined,
): ColumnType<T>[] {
  return (columns ?? []).filter(
    (col): col is ColumnType<T> => !("children" in col),
  );
}

function sttColumn<T>(page: number, pageSize: number): ColumnType<T> {
  return {
    title: "STT",
    key: "stt",
    width: 64,
    align: "center",
    fixed: "left",
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
  sort: SortParam | undefined,
  enableMultiSort: boolean,
): ColumnsType<T> {
  const parsed = parseSortParams(sort);
  return columns.map((col) => {
    if (!("sorter" in col) || !col.sorter) return col;
    const dataIndex =
      "dataIndex" in col && typeof col.dataIndex === "string"
        ? col.dataIndex
        : undefined;
    const field =
      dataIndex ?? (typeof col.key === "string" ? col.key : undefined);
    const match = parsed.find((item) => item.field === field);
    const sortOrder = match?.order ?? null;
    let sorter = col.sorter;
    if (enableMultiSort) {
      if (sorter === true) {
        sorter = { multiple: 1 };
      } else if (typeof sorter === "object" && sorter !== null) {
        sorter = { ...sorter, multiple: 1 };
      }
    }
    return { ...col, sorter, sortOrder };
  });
}

type DragIndexState = {
  active: UniqueIdentifier;
  over: UniqueIdentifier | undefined;
  direction?: "left" | "right";
};

const DragIndexContext = createContext<DragIndexState>({
  active: -1,
  over: -1,
});

function dragActiveStyle(
  dragState: DragIndexState,
  id: string,
): CSSProperties {
  const { active, over, direction } = dragState;
  if (active && active === id) {
    return { backgroundColor: "gray", opacity: 0.5 };
  }
  if (over && id === over && active !== over) {
    return direction === "right"
      ? { borderInlineEnd: "1px dashed gray" }
      : { borderInlineStart: "1px dashed gray" };
  }
  return {};
}

type HeaderCellProps = HTMLAttributes<HTMLTableCellElement> & {
  id?: string;
};
type BodyCellProps = HTMLAttributes<HTMLTableCellElement> & { id?: string };

/** Selection / STT / fixed columns — no dnd-kit (avoids stuck `pressed` + overlap). */
function PlainHeaderCell(props: HeaderCellProps) {
  const { id: _id, ...rest } = props;
  return <th {...rest} />;
}

function PlainBodyCell(props: BodyCellProps) {
  const { id: _id, ...rest } = props;
  return <td {...rest} />;
}

function DraggableBodyCell(props: BodyCellProps & { id: string }) {
  const dragState = useContext(DragIndexContext);
  const { id, ...rest } = props;
  return (
    <td
      {...rest}
      style={{ ...props.style, ...dragActiveStyle(dragState, id) }}
    />
  );
}

function DraggableHeaderCell(props: HeaderCellProps & { id: string }) {
  const dragState = useContext(DragIndexContext);
  const { id, title, ...rest } = props;
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id,
  });
  const style: CSSProperties = {
    ...props.style,
    cursor: "grab",
    ...(isDragging
      ? {
          position: "relative",
          zIndex: 9999,
          userSelect: "none",
          cursor: "grabbing",
        }
      : {}),
    ...dragActiveStyle(dragState, id),
  };
  return (
    <th
      {...rest}
      ref={setNodeRef}
      style={style}
      title={
        typeof title === "string" && title.trim()
          ? title
          : "Kéo để đổi thứ tự cột"
      }
      {...attributes}
      {...listeners}
    />
  );
}

function TableHeaderCell(props: HeaderCellProps) {
  if (props.id == null || props.id === "") {
    return <PlainHeaderCell {...props} />;
  }
  return <DraggableHeaderCell {...props} id={props.id} />;
}

function TableBodyCell(props: BodyCellProps) {
  if (props.id == null || props.id === "") {
    return <PlainBodyCell {...props} />;
  }
  return <DraggableBodyCell {...props} id={props.id} />;
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
  enableColumnSetting = false,
  enableRowSelection = false,
  enableColumnDrag = false,
  enableMultiSort = false,
  rowSelection: rowSelectionProp,
  components: componentsProp,
  ...tableProps
}: DataTableProps<T>) {
  const [clientPage, setClientPage] = useState(1);
  const [clientPageSize, setClientPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [visibleKeys, setVisibleKeys] = useState<string[] | null>(null);
  const [columnOrder, setColumnOrder] = useState<string[] | null>(null);
  const [dragIndex, setDragIndex] = useState<DragIndexState>({
    active: -1,
    over: -1,
  });

  const page = serverSide ? (pageProp ?? 1) : clientPage;
  const pageSize = serverSide
    ? (pageSizeProp ?? DEFAULT_PAGE_SIZE)
    : clientPageSize;

  const rows = (data ?? dataSource ?? []) as T[];
  const baseColumns = asDataColumns(columns);

  const keyedColumns = useMemo((): KeyedColumn<T>[] => {
    return baseColumns.map((col, index) => {
      const key = columnKey(col, index);
      return { ...col, key };
    });
  }, [baseColumns]);

  const allKeys = useMemo(
    () => keyedColumns.map((col) => col.key),
    [keyedColumns],
  );

  useEffect(() => {
    const mergeKeys = (prev: string[] | null): string[] => {
      if (prev == null) return allKeys;
      const keep = prev.filter((k) => allKeys.includes(k));
      const added = allKeys.filter((k) => !prev.includes(k));
      const next = [...keep, ...added];
      if (
        next.length === prev.length &&
        next.every((key, index) => key === prev[index])
      ) {
        return prev;
      }
      return next;
    };
    setVisibleKeys(mergeKeys);
    setColumnOrder(mergeKeys);
  }, [allKeys]);

  const columnSettingOptions: ColumnSettingOption[] = useMemo(
    () =>
      keyedColumns.map((col) => ({
        key: col.key,
        label: columnLabel(col, col.key),
      })),
    [keyedColumns],
  );

  const effectiveVisible = visibleKeys ?? allKeys;
  const effectiveOrder = columnOrder ?? allKeys;

  const orderedDataColumns = useMemo((): KeyedColumn<T>[] => {
    const byKey = new Map(keyedColumns.map((col) => [col.key, col] as const));
    const ordered: KeyedColumn<T>[] = [];
    for (const key of effectiveOrder) {
      const col = byKey.get(key);
      if (col) ordered.push(col);
    }
    const visible = enableColumnSetting
      ? ordered.filter((col) => effectiveVisible.includes(col.key))
      : ordered;
    const withSort = serverSide
      ? (withSortOrder(visible, sort, enableMultiSort) as KeyedColumn<T>[])
      : visible;
    return withSort;
  }, [
    keyedColumns,
    effectiveOrder,
    enableColumnSetting,
    effectiveVisible,
    serverSide,
    sort,
    enableMultiSort,
  ]);

  const dragReadyColumns = useMemo((): KeyedColumn<T>[] => {
    if (!enableColumnDrag) return orderedDataColumns;
    return orderedDataColumns.map((col) => {
      // Fixed left/right (actions, etc.) stay out of dnd — prevents layout smash.
      if (col.fixed) return col;
      const id = col.key;
      return {
        ...col,
        onHeaderCell: () => ({ id }),
        onCell: () => ({ id }),
      };
    });
  }, [enableColumnDrag, orderedDataColumns]);

  const mergedColumns: ColumnsType<T> = showStt
    ? [sttColumn<T>(page, pageSize), ...dragReadyColumns]
    : dragReadyColumns;

  const dragItems = useMemo(
    () =>
      dragReadyColumns
        .filter((col) => !col.fixed && col.onHeaderCell)
        .map((col) => col.key),
    [dragReadyColumns],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Let header sort clicks work; drag only after a short move.
      activationConstraint: { distance: 8 },
    }),
  );

  const onDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (active.id !== over?.id) {
        setColumnOrder((prev) => {
          const order = prev ?? allKeys;
          const activeIndex = order.findIndex((k) => k === active.id);
          const overIndex = order.findIndex((k) => k === over?.id);
          if (activeIndex < 0 || overIndex < 0) return order;
          return arrayMove(order, activeIndex, overIndex);
        });
      }
      setDragIndex({ active: -1, over: -1 });
    },
    [allKeys],
  );

  const onDragOver = useCallback(
    ({ active, over }: DragOverEvent) => {
      const order = columnOrder ?? allKeys;
      const activeIndex = order.findIndex((k) => k === active.id);
      const overIndex = order.findIndex((k) => k === over?.id);
      setDragIndex({
        active: active.id,
        over: over?.id,
        direction: overIndex > activeIndex ? "right" : "left",
      });
    },
    [allKeys, columnOrder],
  );

  const resolvedRowSelection = enableRowSelection
    ? {
        columnWidth: 48,
        fixed: true as const,
        ...(rowSelectionProp ?? {
          selectedRowKeys,
          onChange: (keys: Key[]) => setSelectedRowKeys(keys),
        }),
      }
    : rowSelectionProp;

  const columnSettingNode = enableColumnSetting ? (
    <ColumnSetting
      options={columnSettingOptions}
      value={effectiveVisible}
      onChange={setVisibleKeys}
    />
  ) : null;

  const mergedToolbarExtra =
    columnSettingNode || toolbarExtra ? (
      <>
        {columnSettingNode}
        {toolbarExtra}
      </>
    ) : null;

  const toolbarNode =
    toolbar || mergedToolbarExtra ? (
      <TableToolbar extra={mergedToolbarExtra}>{toolbar}</TableToolbar>
    ) : null;

  if (loading && rows.length === 0 && showSkeleton) {
    return (
      <>
        {toolbarNode}
        <TableSkeleton rows={skeletonRows} />
      </>
    );
  }

  const tableNode = (
    <Table<T>
      {...tableProps}
      sticky={sticky}
      columns={mergedColumns}
      dataSource={rows}
      rowSelection={resolvedRowSelection}
      components={
        enableColumnDrag
          ? {
              ...componentsProp,
              header: {
                ...componentsProp?.header,
                cell: TableHeaderCell,
              },
              body: {
                ...componentsProp?.body,
                cell: TableBodyCell,
              },
            }
          : componentsProp
      }
      loading={
        loading
          ? { spinning: true, description: LOADING_TIP }
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
        const sorters = Array.isArray(sorter) ? sorter : [sorter];
        const sorts = sorters
          .map((item) =>
            toSortParam(sorterField(item ?? {}), item?.order ?? null),
          )
          .filter((item): item is string => Boolean(item));
        let nextSort: SortParam | undefined;
        if (enableMultiSort) {
          nextSort =
            sorts.length > 1 ? sorts : sorts.length === 1 ? sorts[0] : undefined;
        } else {
          nextSort = sorts[0];
        }
        onQueryChange({
          page: serverSide ? (pagination.current ?? 1) : 1,
          pageSize: serverSide
            ? (pagination.pageSize ?? DEFAULT_PAGE_SIZE)
            : pageSize,
          sort: nextSort,
        });
      }}
    />
  );

  const overlayTitle = dragReadyColumns.find(
    (col) => col.key === String(dragIndex.active),
  )?.title;

  return (
    <>
      {toolbarNode}
      {enableColumnDrag ? (
        <DndContext
          sensors={sensors}
          modifiers={[restrictToHorizontalAxis]}
          onDragEnd={onDragEnd}
          onDragOver={onDragOver}
          collisionDetection={closestCenter}
        >
          <SortableContext
            items={dragItems}
            strategy={horizontalListSortingStrategy}
          >
            <DragIndexContext.Provider value={dragIndex}>
              {tableNode}
            </DragIndexContext.Provider>
          </SortableContext>
          <DragOverlay>
            <th style={{ backgroundColor: "gray", padding: 16 }}>
              {overlayTitle as ReactNode}
            </th>
          </DragOverlay>
        </DndContext>
      ) : (
        tableNode
      )}
    </>
  );
}
