import { useCallback, useState } from "react";
import { useToast } from "@/components/ui/feedback/useFeedback";
import { getApiErrorMessage } from "@/lib/api-error";
import { downloadAuthenticatedFile } from "@/lib/download";

/** Export CSV with loading flag + toast on failure. */
export function useAuthenticatedExport() {
  const toast = useToast();
  const [exporting, setExporting] = useState(false);

  const runExport = useCallback(
    async (
      path: string,
      filename: string,
      params?: Record<string, string | number | undefined>,
    ) => {
      setExporting(true);
      try {
        await downloadAuthenticatedFile(path, filename, params);
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Không xuất được CSV"));
      } finally {
        setExporting(false);
      }
    },
    [toast],
  );

  return { exporting, runExport };
}
