export function formatVnd(amount: number | undefined | null): string {
  const value = amount ?? 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Billing quantum: 30 minutes (minimum 1 block when duration > 0). */
export const BILLING_BLOCK_MINUTES = 30;

/** Actual elapsed hours between two ISO timestamps (fractional). */
export function durationHours(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0;
  }
  return (end - start) / 3_600_000;
}

/**
 * Billable hours: ceil(duration / 30min) × 0.5h.
 * Example: 10 minutes → 0.5h; 31 minutes → 1h.
 */
export function billableHours(startIso: string, endIso: string): number {
  const actual = durationHours(startIso, endIso);
  if (actual <= 0) return 0;
  const blocks = Math.ceil((actual * 60) / BILLING_BLOCK_MINUTES);
  return blocks * (BILLING_BLOCK_MINUTES / 60);
}

/** Estimate booking fee: pricePerHour × billableHours, rounded to whole VND. */
export function estimateBookingAmount(
  pricePerHour: number,
  startIso: string,
  endIso: string,
): number {
  return Math.round(pricePerHour * billableHours(startIso, endIso));
}
