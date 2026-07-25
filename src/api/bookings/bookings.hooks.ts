import { useCallback, useEffect, useState } from "react";
import { getBookings } from "./bookings.service";
import { getRooms } from "../rooms/rooms.service";
import type { Booking } from "./bookings.types";
import type { Room } from "../rooms/rooms.types";

/** All bookings (no date filter) — admin history / approval. */
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
        const bookings = await getBookings();
        if (!controller.signal.aborted) {
          setData(bookings);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
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
          getRooms(),
          getBookings(date),
        ]);
        if (!controller.signal.aborted) {
          setRooms(roomsData.filter((room) => room.isActive));
          setBookings(bookingsData);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
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
