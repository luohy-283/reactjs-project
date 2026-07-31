import { ErrorPage } from "@/components/ui/error/ErrorPage";
import { RetryButton } from "@/components/ui/error/RetryButton";
import { getApiErrorMessage } from "@/lib/api-error";

type Props = {
  error: unknown;
  fallback: string;
  onRetry: () => void;
  loading?: boolean;
};

/** Hard list/schedule load failure — ErrorPage + RetryButton. */
export function FetchError({ error, fallback, onRetry, loading }: Props) {
  return (
    <ErrorPage
      description={getApiErrorMessage(error, fallback)}
      extra={<RetryButton onRetry={onRetry} loading={loading} />}
    />
  );
}
