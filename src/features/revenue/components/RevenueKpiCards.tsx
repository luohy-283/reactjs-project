import type { ReactNode } from "react";
import { Card } from "primereact/card";
import type {
  RevenuePeriod,
  RevenueReport,
} from "@/features/revenue/api/revenue.types";
import { formatVnd } from "@/lib/money";
import { useIsDarkMode } from "@/lib/useIsDarkMode";

type DeltaKind = "higherBetter" | "lowerBetter";

type KpiDef = {
  key: string;
  title: string;
  value: number;
  previous: number;
  kind: DeltaKind;
  formatValue?: (v: number) => ReactNode;
};

function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return 0;
    return null;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

/** "06/2026" → "tháng 06/2026"; already "tháng trước" stays as-is. */
function monthRef(previousMonth: string): string {
  if (!previousMonth || previousMonth.startsWith("tháng ")) {
    return previousMonth || "tháng trước";
  }
  return `tháng ${previousMonth}`;
}

function formatPercentVi(value: number): string {
  return value.toFixed(1).replace(".", ",");
}

function formatDeltaLabel(delta: number | null, previousMonth: string): string {
  const ref = monthRef(previousMonth);
  if (delta == null) return `Không so sánh được với ${ref}`;
  if (delta === 0) return `Bằng ${ref}`;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${formatPercentVi(delta)}% so với ${ref}`;
}

function deltaColor(
  delta: number | null,
  kind: DeltaKind,
  isDark: boolean,
): string {
  const secondary = isDark ? "#a6a6a6" : "#8c8c8c";
  const success = "#52c41a";
  const error = "#ff4d4f";
  if (delta == null || delta === 0) return secondary;
  const isGood = kind === "higherBetter" ? delta > 0 : delta < 0;
  return isGood ? success : error;
}

function KpiDelta({
  current,
  previous,
  previousMonth,
  kind,
}: {
  current: number;
  previous: number;
  previousMonth: string;
  kind: DeltaKind;
}) {
  const isDark = useIsDarkMode();
  const delta = percentDelta(current, previous);
  return (
    <div
      style={{
        color: deltaColor(delta, kind, isDark),
        fontSize: 13,
        marginTop: 8,
      }}
    >
      {formatDeltaLabel(delta, previousMonth)}
    </div>
  );
}

function buildKpis(
  data: RevenueReport | null,
  previous: RevenuePeriod,
): KpiDef[] {
  return [
    {
      key: "total",
      title: "Tổng doanh thu",
      value: data?.totalAmount ?? 0,
      previous: previous.totalAmount,
      kind: "higherBetter",
      formatValue: (v) => formatVnd(v),
    },
    {
      key: "bookings",
      title: "Lịch đã duyệt",
      value: data?.totalBookings ?? 0,
      previous: previous.totalBookings,
      kind: "higherBetter",
    },
    {
      key: "average",
      title: "Doanh thu TB / lịch",
      value: data?.averageAmount ?? 0,
      previous: previous.averageAmount,
      kind: "higherBetter",
      formatValue: (v) => formatVnd(v),
    },
    {
      key: "cancelRate",
      title: "Tỷ lệ hủy",
      value: data?.cancellationRate ?? 0,
      previous: previous.cancellationRate,
      kind: "lowerBetter",
      formatValue: (v) => `${Number(v).toFixed(1)}%`,
    },
  ];
}

export function RevenueKpiCards({
  data,
  loading,
}: {
  data: RevenueReport | null;
  loading: boolean;
}) {
  const isDark = useIsDarkMode();
  const previous: RevenuePeriod = data?.previous ?? {
    yearMonth: "",
    totalAmount: 0,
    totalBookings: 0,
    averageAmount: 0,
    cancelledCount: 0,
    cancellationRate: 0,
  };
  const previousMonth = previous.yearMonth
    ? previous.yearMonth.slice(5) + "/" + previous.yearMonth.slice(0, 4)
    : "tháng trước";

  const kpis = buildKpis(data, previous);
  const muted = isDark ? "#a6a6a6" : "#8c8c8c";

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        marginBottom: 24,
      }}
    >
      {kpis.map((kpi) => (
        <div key={kpi.key} style={{ flex: "1 1 200px", minWidth: 0 }}>
          <Card>
            {loading ? (
              <div style={{ height: 72 }} />
            ) : (
              <>
                <div style={{ color: muted, fontSize: 14, marginBottom: 4 }}>
                  {kpi.title}
                </div>
                <div style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.2 }}>
                  {kpi.formatValue
                    ? kpi.formatValue(kpi.value)
                    : kpi.value}
                </div>
                <KpiDelta
                  current={kpi.value}
                  previous={kpi.previous}
                  previousMonth={previousMonth}
                  kind={kpi.kind}
                />
              </>
            )}
          </Card>
        </div>
      ))}
    </div>
  );
}
