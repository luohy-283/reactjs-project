import { useCallback, useEffect, useState } from "react";
import {
  getDepartmentChangeRequests,
  getUsers,
} from "@/features/users/api/users.service";
import type {
  DepartmentChangeRequest,
  ManagedUser,
} from "@/features/users/api/users.types";
import { isAbortError } from "@/lib/api-error";

export function useUsers() {
  const [data, setData] = useState<ManagedUser[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await getUsers());
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
        const users = await getUsers(controller.signal);
        if (!controller.signal.aborted) {
          setData(users);
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

export function usePendingDepartmentChanges() {
  const [data, setData] = useState<DepartmentChangeRequest[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await getDepartmentChangeRequests("PENDING"));
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
        const items = await getDepartmentChangeRequests(
          "PENDING",
          controller.signal,
        );
        if (!controller.signal.aborted) {
          setData(items);
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
