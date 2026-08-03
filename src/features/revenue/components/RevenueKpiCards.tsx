import { Card, Col, Row, Statistic, Typography, theme } from "antd";
import type { ReactNode } from "react";
import type { RevenuePeriod, RevenueReport } from "@/features/revenue/api/revenue.types";
import { formatVnd } from "@/lib/money";

type DeltaKind = "higherBetter" | "lowerBetter";

type KpiDef = {
  key: string;
  title: string;
  value: number;
  previous: number;
  kind: DeltaKind;
  formatter?: (v: number | string) => ReactNode;
  suffix?: string;
  precision?: number;
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
  colors: { secondary: string; success: string; error: string },
): string {
  if (delta == null || delta === 0) return colors.secondary;
  const isGood = kind === "higherBetter" ? delta > 0 : delta < 0;
  return isGood ? colors.success : colors.error;
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
  const { token } = theme.useToken();
  const delta = percentDelta(current, previous);
  return (
    <Typography.Text
      style={{
        color: deltaColor(delta, kind, {
          secondary: token.colorTextSecondary,
          success: token.colorSuccess,
          error: token.colorError,
        }),
        fontSize: 13,
      }}
    >
      {formatDeltaLabel(delta, previousMonth)}
    </Typography.Text>
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
      formatter: (v) => formatVnd(Number(v)),
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
      formatter: (v) => formatVnd(Number(v)),
    },
    {
      key: "cancelRate",
      title: "Tỷ lệ hủy",
      value: data?.cancellationRate ?? 0,
      previous: previous.cancellationRate,
      kind: "lowerBetter",
      suffix: "%",
      precision: 1,
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

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      {kpis.map((kpi) => (
        <Col key={kpi.key} xs={24} sm={12} xl={6}>
          <Card loading={loading}>
            <Statistic
              title={kpi.title}
              value={kpi.value}
              formatter={kpi.formatter}
              suffix={kpi.suffix}
              precision={kpi.precision}
            />
            <KpiDelta
              current={kpi.value}
              previous={kpi.previous}
              previousMonth={previousMonth}
              kind={kpi.kind}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
