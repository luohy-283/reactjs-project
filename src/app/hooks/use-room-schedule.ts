import { useCallback, useEffect, useState } from "react";
import { getBookings } from "@/features/bookings/api/bookings.service";
import { getRooms } from "@/features/rooms/api/rooms.service";
import { isAbortError } from "@/lib/api-error";
import type { Booking } from "@/features/bookings/api/bookings.types";
import type { Room } from "@/features/rooms/api/rooms.types";

/** Composes rooms + bookings APIs at the app layer (no cross-feature imports). */
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
