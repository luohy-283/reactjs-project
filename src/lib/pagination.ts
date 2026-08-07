/** Shared page size for every list Table in the app. */
export const DEFAULT_PAGE_SIZE = 10;

/** Default pagination options for list tables. */
export const TABLE_PAGINATION = {
  pageSize: DEFAULT_PAGE_SIZE,
  showSizeChanger: false,
} as const;

export interface PageParams {
  /** Spring page index, 0-based */
  page?: number;
  size?: number;
  /** Spring sort, e.g. `startTime,desc` */
  sort?: string;
}

/** Table query (1-based page) → map to Spring `PageParams` via `toPageParams`. */
export type TableQuery = {
  page: number;
  pageSize: number;
  sort?: string;
};

export function toPageParams(query: TableQuery): PageParams {
  return {
    page: Math.max(0, query.page - 1),
    size: query.pageSize,
    sort: query.sort,
  };
}

/** Ant Design (`ascend`/`descend`) or PrimeReact (`1`/`-1`) sort order. */
export type SortOrderInput =
  | "ascend"
  | "descend"
  | 1
  | -1
  | 0
  | null
  | undefined;

/** Build Spring `sort` from field + Ant/Prime sort order. */
export function toSortParam(
  field: string | undefined,
  order: SortOrderInput,
): string | undefined {
  if (!field || order == null || order === 0) return undefined;
  if (order === "ascend" || order === 1) return `${field},asc`;
  if (order === "descend" || order === -1) return `${field},desc`;
  return undefined;
}

/** Parse Spring `sort` into PrimeReact DataTable `sortField` / `sortOrder`. */
export function parseSortParam(
  sort: string | undefined,
): { field: string; order: 1 | -1 } | null {
  if (!sort) return null;
  const [field, dir] = sort.split(",");
  if (!field) return null;
  if (dir === "asc") return { field, order: 1 };
  if (dir === "desc") return { field, order: -1 };
  return null;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface SpringPageResponse<T> {
  content?: T[];
  number?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
}

function asArray<T>(data: T[] | T | null | undefined): T[] {
  if (Array.isArray(data)) return data;
  if (data == null) return [];
  return [data];
}

export function isSpringPageResponse<T>(
  data: T[] | T | SpringPageResponse<T> | null | undefined,
): data is SpringPageResponse<T> {
  if (data == null || typeof data !== "object" || Array.isArray(data)) {
    return false;
  }
  return "content" in data;
}

export function toPagedResult<TBackend, TItem>(
  data: TBackend[] | TBackend | SpringPageResponse<TBackend> | null | undefined,
  mapItem: (item: TBackend) => TItem,
): PagedResult<TItem> {
  if (isSpringPageResponse(data)) {
    const items = asArray(data.content).map(mapItem);
    return {
      items,
      page: data.number ?? 0,
      size: data.size ?? items.length,
      totalElements: data.totalElements ?? items.length,
      totalPages: data.totalPages ?? 1,
    };
  }

  const items = asArray(data).map(mapItem);
  return {
    items,
    page: 0,
    size: items.length,
    totalElements: items.length,
    totalPages: 1,
  };
}

/** Extract items only — for screens that need full list (Dashboard). */
export function toItems<TBackend, TItem>(
  data: TBackend[] | TBackend | SpringPageResponse<TBackend> | null | undefined,
  mapItem: (item: TBackend) => TItem,
): TItem[] {
  return toPagedResult(data, mapItem).items;
}
