import { useMemo } from "react";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { NoData } from "@/components/ui/empty/NoData";
import { lineChartOptions } from "@/features/revenue/lib/chartVnd";
import { useIsDarkMode } from "@/lib/useIsDarkMode";

export function RevenueTrendArea({
  yearMonth,
  loading,
  data,
}: {
  yearMonth: string;
  loading: boolean;
  data: Array<{ date: string; amount: number }>;
}) {
  const isDark = useIsDarkMode();
  const hasData = data.some((d) => d.amount > 0);

  const chartData = useMemo(
    () => ({
      labels: data.map((d) => d.date),
      datasets: [
        {
          label: "Doanh thu",
          data: data.map((d) => d.amount),
          fill: true,
          tension: 0.4,
          borderColor: isDark ? "#1668dc" : "#1677ff",
          backgroundColor: isDark
            ? "rgba(22, 104, 220, 0.35)"
            : "rgba(105, 177, 255, 0.4)",
          borderWidth: 2,
          pointRadius: 0,
        },
      ],
    }),
    [data, isDark],
  );

  const options = useMemo(() => lineChartOptions(isDark), [isDark]);

  return (
    <Card
      title={`Xu hướng doanh thu theo ngày · ${yearMonth}`}
      style={{ marginBottom: 24 }}
    >
      {loading ? (
        <div style={{ height: 320 }} />
      ) : !hasData ? (
        <NoData description="Chưa có doanh thu trong tháng này" />
      ) : (
        <div style={{ height: 320 }}>
          <Chart
            key={isDark ? "dark" : "light"}
            type="line"
            data={chartData}
            options={options}
            style={{ height: "100%" }}
          />
        </div>
      )}
    </Card>
  );
}
