import { Card } from "antd";
import { Area } from "@ant-design/plots";
import { NoData } from "@/components/ui/empty/NoData";
import {
  vndAxisLabel,
  vndTooltipItems,
} from "@/features/revenue/lib/chartVnd";

export function RevenueTrendArea({
  yearMonth,
  loading,
  data,
}: {
  yearMonth: string;
  loading: boolean;
  data: Array<{ date: string; amount: number }>;
}) {
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
          data={data}
          xField="date"
          yField="amount"
          height={320}
          shapeField="smooth"
          style={{
            fill: "linear-gradient(-90deg, white 0%, #69b1ff 100%)",
            fillOpacity: 0.4,
            lineWidth: 2,
          }}
          axis={{ y: { labelFormatter: vndAxisLabel } }}
          tooltip={{ items: vndTooltipItems() }}
        />
      )}
    </Card>
  );
}
