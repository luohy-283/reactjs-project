import { Card, Col, Row } from "antd";
import { Column, Pie } from "@ant-design/plots";
import { NoData } from "@/components/ui/empty/NoData";
import type { RevenueByRoom } from "@/features/revenue/api/revenue.types";
import {
  vndAxisLabel,
  vndTooltipItems,
} from "@/features/revenue/lib/chartVnd";

/** Top slices on pie; remainder grouped as "Khác". */
export const PIE_TOP_ROOMS = 8;
/** Top rooms on vertical column (absolute comparison). */
export const COLUMN_TOP_ROOMS = 8;

function toPieData(rooms: RevenueByRoom[]) {
  const top = rooms.slice(0, PIE_TOP_ROOMS);
  const rest = rooms.slice(PIE_TOP_ROOMS);
  const items = top.map((r) => ({
    room: r.roomName,
    amount: r.amount,
  }));
  const restAmount = rest.reduce((sum, r) => sum + r.amount, 0);
  if (restAmount > 0) {
    items.push({ room: "Khác", amount: restAmount });
  }
  const total = items.reduce((sum, r) => sum + r.amount, 0);
  return items.map((item) => ({
    ...item,
    percentLabel:
      total > 0 ? `${((item.amount / total) * 100).toFixed(0)}%` : "0%",
  }));
}

export function RevenueRoomCharts({
  loading,
  roomsWithRevenue,
}: {
  loading: boolean;
  roomsWithRevenue: RevenueByRoom[];
}) {
  const pieData = toPieData(roomsWithRevenue);
  const columnData = roomsWithRevenue
    .slice(0, COLUMN_TOP_ROOMS)
    .map((r) => ({ room: r.roomName, amount: r.amount }));
  const hasRoomRevenue = roomsWithRevenue.length > 0;

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} lg={12}>
        <Card title="Tỷ trọng doanh thu theo phòng" loading={loading}>
          {!hasRoomRevenue ? (
            <NoData description="Chưa có dữ liệu theo phòng" />
          ) : (
            <Pie
              data={pieData}
              angleField="amount"
              colorField="room"
              radius={0.9}
              innerRadius={0.6}
              height={320}
              legend={{
                color: {
                  position: "bottom",
                  layout: { justifyContent: "center" },
                },
              }}
              label={{
                text: "percentLabel",
                position: "spider",
                transform: [{ type: "overlapDodgeY" }],
              }}
              tooltip={{
                title: "room",
                items: vndTooltipItems(),
              }}
            />
          )}
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card
          title={`Top ${COLUMN_TOP_ROOMS} phòng theo doanh thu`}
          loading={loading}
        >
          {columnData.length === 0 ? (
            <NoData description="Chưa có dữ liệu theo phòng" />
          ) : (
            <Column
              data={columnData}
              xField="room"
              yField="amount"
              height={320}
              axis={{
                x: {
                  labelAutoRotate: true,
                  labelAutoHide: true,
                },
                y: { labelFormatter: vndAxisLabel },
              }}
              tooltip={{ items: vndTooltipItems() }}
            />
          )}
        </Card>
      </Col>
    </Row>
  );
}
