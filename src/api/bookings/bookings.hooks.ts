import { useCallback, useEffect, useState } from "react";
import { getBookings, getBookingsPage } from "./bookings.service";
import { getRooms } from "../rooms/rooms.service";
import { isAbortError } from "../../lib/api-error";
import type { Booking } from "./bookings.types";
import type { Room } from "../rooms/rooms.types";

const DEFAULT_PAGE_SIZE = 10;

/** Server-side pagination — Admin history tab. */
export function usePaginatedBookings(pageSize = DEFAULT_PAGE_SIZE) {
  const [data, setData] = useState<Booking[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPage = useCallback(
    async (targetPage: number, signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getBookingsPage({
          page: targetPage,
          size: pageSize,
          sort: "startTime,desc",
          signal,
        });
        if (!signal?.aborted) {
          setData(result.items);
          setPage(result.page);
          setTotal(result.totalElements);
        }
      } catch (err) {
        if (!signal?.aborted && !isAbortError(err)) {
          setError(err);
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [pageSize],
  );

  const refetch = useCallback(async () => {
    await fetchPage(page);
  }, [fetchPage, page]);

  const onPageChange = useCallback(
    (nextPage: number) => {
      void fetchPage(nextPage - 1);
    },
    [fetchPage],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchPage(0, controller.signal);
    return () => controller.abort();
  }, [fetchPage]);

  return {
    data,
    page: page + 1,
    pageSize,
    total,
    error,
    isLoading,
    refetch,
    onPageChange,
  };
}

/** Full list — pending/upcoming tabs (operational queues). */
export function useBookings() {
  const [data, setData] = useState<Booking[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await getBookings());
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const bookings = await getBookings(undefined, controller.signal);
        if (!controller.signal.aborted) {
          setData(bookings);
        }
      } catch (err) {
        if (!controller.signal.aborted && !isAbortError(err)) {
          setError(err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, []);

  return { data, error, isLoading, refetch };
}

export function useRoomSchedule(date: string) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [roomsData, bookingsData] = await Promise.all([
        getRooms(),
        getBookings(date),
      ]);
      setRooms(roomsData.filter((room) => room.isActive));
      setBookings(bookingsData);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [roomsData, bookingsData] = await Promise.all([
          getRooms(controller.signal),
          getBookings(date, controller.signal),
        ]);
        if (!controller.signal.aborted) {
          setRooms(roomsData.filter((room) => room.isActive));
          setBookings(bookingsData);
        }
      } catch (err) {
        if (!controller.signal.aborted && !isAbortError(err)) {
          setError(err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [date]);

  return { rooms, bookings, error, isLoading, refetch };
}
