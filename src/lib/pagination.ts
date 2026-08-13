/** Shared page size for every list Table in the app. */
export const DEFAULT_PAGE_SIZE = 10;

/** Ant Design Table pagination — same config on all list screens. */
export const TABLE_PAGINATION = {
  pageSize: DEFAULT_PAGE_SIZE,
  showSizeChanger: false,
} as const;

/** Spring `sort` — one value or repeated `sort=` params for multi-sort. */
export type SortParam = string | string[];

export interface PageParams {
  /** Spring page index, 0-based */
  page?: number;
  size?: number;
  /** Spring sort, e.g. `startTime,desc` or `['startTime,desc','title,asc']` */
  sort?: SortParam;
}

/** Ant Design table query (1-based page) → map to Spring `PageParams` via `toPageParams`. */
export type TableQuery = {
  page: number;
  pageSize: number;
  sort?: SortParam;
};

export function toPageParams(query: TableQuery): PageParams {
  return {
    page: Math.max(0, query.page - 1),
    size: query.pageSize,
    sort: query.sort,
  };
}

/** Build Spring `sort` from Ant Design sorter field + order. */
export function toSortParam(
  field: string | undefined,
  order: "ascend" | "descend" | null | undefined,
): string | undefined {
  if (!field || !order) return undefined;
  return `${field},${order === "ascend" ? "asc" : "desc"}`;
}

export function parseSortParam(
  sort: string | undefined,
): { field: string; order: "ascend" | "descend" } | null {
  if (!sort) return null;
  const [field, dir] = sort.split(",");
  if (!field) return null;
  if (dir === "asc") return { field, order: "ascend" };
  if (dir === "desc") return { field, order: "descend" };
  return null;
}

export function asSortList(sort: SortParam | undefined): string[] {
  if (!sort) return [];
  return Array.isArray(sort) ? sort.filter(Boolean) : [sort];
}

export function parseSortParams(
  sort: SortParam | undefined,
): { field: string; order: "ascend" | "descend" }[] {
  return asSortList(sort)
    .map((item) => parseSortParam(item))
    .filter(
      (item): item is { field: string; order: "ascend" | "descend" } =>
        item != null,
    );
}

/**
 * Serialize flat query params for Spring — arrays become repeated keys
 * (`sort=a,asc&sort=b,desc`), not `sort[]=`.
 */
export function serializeSpringParams(
  params: Record<string, unknown>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) continue;
        search.append(key, String(item));
      }
    } else {
      search.append(key, String(value));
    }
  }
  return search.toString();
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
