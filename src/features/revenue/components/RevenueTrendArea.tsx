import { Card } from "antd";
import { Area } from "@ant-design/plots";
import { NoData } from "@/components/ui/empty/NoData";
import {
  plotTheme,
  vndAxisLabel,
  vndTooltipItems,
} from "@/features/revenue/lib/chartVnd";
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

  return (
    <Card
      title={`Xu hướng doanh thu theo ngày · ${yearMonth}`}
      loading={loading}
      style={{ marginBottom: 24 }}
    >
      {!hasData ? (
        <NoData description="Chưa có doanh thu trong tháng này" />
      ) : (
        <Area
          key={isDark ? "dark" : "light"}
          theme={plotTheme(isDark)}
          data={data}
          xField="date"
          yField="amount"
          height={320}
          shapeField="smooth"
          style={{
            fill: isDark
              ? "linear-gradient(-90deg, transparent 0%, #1668dc 100%)"
              : "linear-gradient(-90deg, white 0%, #69b1ff 100%)",
            fillOpacity: isDark ? 0.55 : 0.4,
            lineWidth: 2,
          }}
          axis={{ y: { labelFormatter: vndAxisLabel } }}
          tooltip={{ items: vndTooltipItems() }}
        />
      )}
    </Card>
  );
}
