import { getRooms, getRoomsPage } from "@/features/rooms/api/rooms.service";
import type { GetRoomsOptions } from "@/features/rooms/api/rooms.service";
import type { Room } from "@/features/rooms/api/rooms.types";
import type { PagedResult } from "@/lib/pagination";
import { useAsyncFetch } from "@/lib/useAsyncFetch";

export function useRooms() {
  return useAsyncFetch((signal) => getRooms(signal), [], {
    initialData: [] as Room[],
  });
}

const EMPTY_PAGE: PagedResult<Room> = {
  items: [],
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
};

export function useRoomsPage(
  options: Omit<GetRoomsOptions, "signal">,
  enabled = true,
) {
  return useAsyncFetch(
    (signal) => getRoomsPage({ ...options, signal }),
    [options.page, options.size, options.sort, options.q, options.active],
    { initialData: EMPTY_PAGE, enabled },
  );
}
