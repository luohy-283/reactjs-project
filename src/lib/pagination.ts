export interface PageParams {
  /** Spring page index, 0-based */
  page?: number;
  size?: number;
  sort?: string;
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
