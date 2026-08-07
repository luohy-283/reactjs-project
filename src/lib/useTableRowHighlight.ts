import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SetURLSearchParams } from "react-router";
import { useToast } from "@/components/ui/feedback/useFeedback";

const HIGHLIGHT_MS = 3000;
const FADE_MS = 450;

type Options = {
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  /** False while the list that should contain the row is still loading. */
  ready: boolean;
  /** Ids currently visible in the table. */
  rowIds: readonly number[];
  missingMessage?: string;
  /** Re-run flash when user clicks the same notification again. */
  flashKey?: string | number;
};

/**
 * Reads `?highlight=<id>`, scrolls that table row into view,
 * keeps highlight for 3s or until the row is clicked (then fades out).
 */
export function useTableRowHighlight({
  searchParams,
  setSearchParams,
  ready,
  rowIds,
  missingMessage = "Bản ghi không còn trong danh sách (có thể đã được xử lý).",
  flashKey,
}: Options) {
  const toast = useToast();
  const toastRef = useRef(toast);
  const missingRef = useRef(missingMessage);

  const raw = searchParams.get("highlight");
  const highlightId = raw && /^\d+$/.test(raw) ? Number(raw) : null;
  const [activeId, setActiveId] = useState<number | null>(null);
  const [fading, setFading] = useState(false);
  const activeIdRef = useRef(activeId);
  const fadingRef = useRef(fading);
  const fadeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);
  useEffect(() => {
    missingRef.current = missingMessage;
  }, [missingMessage]);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);
  useEffect(() => {
    fadingRef.current = fading;
  }, [fading]);

  const rowIdsKey = rowIds.join(",");
  const idSet = useMemo(
    () => new Set(rowIdsKey ? rowIdsKey.split(",").map(Number) : []),
    [rowIdsKey],
  );

  const removeUrlHighlight = useCallback(() => {
    setSearchParams(
      (prev) => {
        if (!prev.has("highlight")) return prev;
        const next = new URLSearchParams(prev);
        next.delete("highlight");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const clearHighlight = useCallback(
    (immediate = false) => {
      if (fadeTimerRef.current != null) {
        window.clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }

      if (immediate || activeIdRef.current == null || fadingRef.current) {
        setFading(false);
        setActiveId(null);
        removeUrlHighlight();
        return;
      }

      setFading(true);
      fadeTimerRef.current = window.setTimeout(() => {
        fadeTimerRef.current = null;
        setFading(false);
        setActiveId(null);
        removeUrlHighlight();
      }, FADE_MS);
    },
    [removeUrlHighlight],
  );

  // Activate + scroll when the target row is available (may re-run often — no timer here).
  useEffect(() => {
    if (!ready || highlightId == null) return;

    if (!idSet.has(highlightId)) {
      toastRef.current.warning(missingRef.current);
      // Defer setState out of the synchronous effect body (react-hooks/set-state-in-effect).
      queueMicrotask(() => clearHighlight(true));
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      if (fadeTimerRef.current != null) {
        window.clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
      setFading(false);
      setActiveId(highlightId);
      const row =
        document.querySelector<HTMLElement>(
          `.p-datatable-tbody > tr[data-row-key="${highlightId}"]`,
        ) ??
        document.querySelector<HTMLElement>(
          `tr[data-row-key="${highlightId}"]`,
        ) ??
        document.querySelector<HTMLElement>(
          `.p-datatable-tbody > tr.table-row-from-notification`,
        );
      row?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [ready, highlightId, flashKey, idSet, clearHighlight]);

  // Auto-dismiss after hold time; fade handled inside clearHighlight.
  useEffect(() => {
    if (activeId == null || fading) return;
    const timer = window.setTimeout(() => {
      clearHighlight();
    }, HIGHLIGHT_MS);
    return () => window.clearTimeout(timer);
  }, [activeId, flashKey, fading, clearHighlight]);

  useEffect(
    () => () => {
      if (fadeTimerRef.current != null) {
        window.clearTimeout(fadeTimerRef.current);
      }
    },
    [],
  );

  const rowClassName = (record: { id: number }) => {
    if (activeId == null || record.id !== activeId) return "";
    return fading
      ? "table-row-from-notification is-fading"
      : "table-row-from-notification";
  };

  const onRow = (record: { id: number }) => ({
    onClick: () => {
      if (activeId != null && record.id === activeId && !fading) {
        clearHighlight();
      }
    },
  });

  return { highlightId, activeId, rowClassName, onRow };
}
