import { Card, Col, Row, Statistic, Typography } from "antd";
import type { RevenuePeriod, RevenueReport } from "@/features/revenue/api/revenue.types";
import { formatVnd } from "@/lib/money";

type DeltaKind = "higherBetter" | "lowerBetter";

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

function deltaColor(delta: number | null, kind: DeltaKind): string {
  if (delta == null || delta === 0) return "rgba(0,0,0,0.45)";
  const isGood = kind === "higherBetter" ? delta > 0 : delta < 0;
  return isGood ? "#389e0d" : "#cf1322";
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
  const delta = percentDelta(current, previous);
  return (
    <Typography.Text style={{ color: deltaColor(delta, kind), fontSize: 13 }}>
      {formatDeltaLabel(delta, previousMonth)}
    </Typography.Text>
  );
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

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} xl={6}>
        <Card loading={loading}>
          <Statistic
            title="Tổng doanh thu"
            value={data?.totalAmount ?? 0}
            formatter={(v) => formatVnd(Number(v))}
          />
          <KpiDelta
            current={data?.totalAmount ?? 0}
            previous={previous.totalAmount}
            previousMonth={previousMonth}
            kind="higherBetter"
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <Card loading={loading}>
          <Statistic
            title="Lịch đã duyệt"
            value={data?.totalBookings ?? 0}
          />
          <KpiDelta
            current={data?.totalBookings ?? 0}
            previous={previous.totalBookings}
            previousMonth={previousMonth}
            kind="higherBetter"
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <Card loading={loading}>
          <Statistic
            title="Doanh thu TB / lịch"
            value={data?.averageAmount ?? 0}
            formatter={(v) => formatVnd(Number(v))}
          />
          <KpiDelta
            current={data?.averageAmount ?? 0}
            previous={previous.averageAmount}
            previousMonth={previousMonth}
            kind="higherBetter"
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <Card loading={loading}>
          <Statistic
            title="Tỷ lệ hủy"
            value={data?.cancellationRate ?? 0}
            suffix="%"
            precision={1}
          />
          <KpiDelta
            current={data?.cancellationRate ?? 0}
            previous={previous.cancellationRate}
            previousMonth={previousMonth}
            kind="lowerBetter"
          />
        </Card>
      </Col>
    </Row>
  );
}
