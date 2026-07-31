import { useCallback } from "react";
import { useSearchParams } from "react-router";

type Options<T extends string> = {
  /** Tab when `?tab` is missing / invalid. */
  defaultTab: T;
  /** Map raw query value → tab key. */
  parse: (raw: string | null) => T;
  /** Keep `?highlight` only while on one of these tabs. */
  highlightTabs?: readonly T[];
};

/**
 * Sync list-page tabs with `?tab=` (and clear `?highlight` when leaving
 * highlight-capable tabs).
 */
export function useUrlTab<T extends string>({
  defaultTab,
  parse,
  highlightTabs,
}: Options<T>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parse(searchParams.get("tab"));

  const setTab = useCallback(
    (next: string) => {
      const key = parse(next);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (key === defaultTab) {
            params.delete("tab");
          } else {
            params.set("tab", key);
          }
          if (highlightTabs && !highlightTabs.includes(key)) {
            params.delete("highlight");
          }
          return params;
        },
        { replace: true },
      );
    },
    [defaultTab, highlightTabs, parse, setSearchParams],
  );

  return { tab, setTab, searchParams, setSearchParams };
}
