import { useCallback, useEffect, useRef, useState } from "react";
import { getBookings } from "@/features/bookings/api/bookings.service";
import { getRooms } from "@/features/rooms/api/rooms.service";
import { isAbortError } from "@/lib/api-error";
import type { Booking } from "@/lib/types/booking";
import type { Room } from "@/features/rooms/api/rooms.types";

type UseRoomScheduleOptions = {
  equipmentCategory?: string[];
};

/** Composes rooms + bookings APIs at the app layer (no cross-feature imports). */
export function useRoomSchedule(
  date: string,
  options: UseRoomScheduleOptions = {},
) {
  const equipmentKey = (options.equipmentCategory ?? []).slice().sort().join(",");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const controllerRef = useRef<AbortController | null>(null);

  const runFetch = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setBookings([]);
    const equipmentCategory = equipmentKey
      ? equipmentKey.split(",")
      : undefined;
    try {
      const [roomsData, bookingsData] = await Promise.all([
        getRooms(controller.signal, {
          active: true,
          equipmentCategory,
        }),
        getBookings(date, controller.signal),
      ]);
      if (!controller.signal.aborted) {
        setRooms(roomsData);
        setBookings(bookingsData);
      }
    } catch (err) {
      if (!controller.signal.aborted && !isAbortError(err)) setError(err);
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }, [date, equipmentKey]);

  useEffect(() => {
    void runFetch();
    return () => controllerRef.current?.abort();
  }, [runFetch]);

  return { rooms, bookings, error, isLoading, refetch: runFetch };
}
