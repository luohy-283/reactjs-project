import { LoadingSpinner } from "@/components/ui/loading/LoadingSpinner";
import type { LoadingSpinnerProps } from "@/components/ui/loading/LoadingSpinner";

export type TableLoadingProps = LoadingSpinnerProps;

/** @deprecated Prefer `LoadingSpinner` — kept for DataTable tip alias. */
export function TableLoading(props: TableLoadingProps) {
  return <LoadingSpinner {...props} />;
}

export { LOADING_TIP as TABLE_LOADING_TIP } from "@/components/ui/loading/LoadingSpinner";
