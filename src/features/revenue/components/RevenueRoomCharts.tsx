import { useMemo } from "react";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { NoData } from "@/components/ui/empty/NoData";
import type { RevenueByRoom } from "@/features/revenue/api/revenue.types";
import {
  barChartOptions,
  pieChartOptions,
} from "@/features/revenue/lib/chartVnd";
import { useIsDarkMode } from "@/lib/useIsDarkMode";

/** Top slices on pie; remainder grouped as "Khác". */
export const PIE_TOP_ROOMS = 8;
/** Top rooms on vertical column (absolute comparison). */
export const COLUMN_TOP_ROOMS = 8;

const PIE_COLORS = [
  "#1677ff",
  "#52c41a",
  "#faad14",
  "#eb2f96",
  "#13c2c2",
  "#722ed1",
  "#fa541c",
  "#2f54eb",
  "#8c8c8c",
];

function toPieSlices(rooms: RevenueByRoom[]) {
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
  return items;
}

export function RevenueRoomCharts({
  loading,
  roomsWithRevenue,
}: {
  loading: boolean;
  roomsWithRevenue: RevenueByRoom[];
}) {
  const isDark = useIsDarkMode();
  const pieSlices = toPieSlices(roomsWithRevenue);
  const columnRooms = roomsWithRevenue.slice(0, COLUMN_TOP_ROOMS);
  const hasRoomRevenue = roomsWithRevenue.length > 0;

  const pieData = useMemo(
    () => ({
      labels: pieSlices.map((s) => s.room),
      datasets: [
        {
          data: pieSlices.map((s) => s.amount),
          backgroundColor: pieSlices.map(
            (_, i) => PIE_COLORS[i % PIE_COLORS.length],
          ),
        },
      ],
    }),
    [pieSlices],
  );

  const barData = useMemo(
    () => ({
      labels: columnRooms.map((r) => r.roomName),
      datasets: [
        {
          label: "Doanh thu",
          data: columnRooms.map((r) => r.amount),
          backgroundColor: isDark ? "#1668dc" : "#69b1ff",
        },
      ],
    }),
    [columnRooms, isDark],
  );

  const pieOptions = useMemo(() => pieChartOptions(isDark), [isDark]);
  const barOptions = useMemo(() => barChartOptions(isDark), [isDark]);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        marginBottom: 24,
      }}
    >
      <div style={{ flex: "1 1 360px", minWidth: 0 }}>
        <Card title="Tỷ trọng doanh thu theo phòng">
          {loading ? (
            <div style={{ height: 320 }} />
          ) : !hasRoomRevenue ? (
            <NoData description="Chưa có dữ liệu theo phòng" />
          ) : (
            <div style={{ height: 320 }}>
              <Chart
                key={isDark ? "pie-dark" : "pie-light"}
                type="doughnut"
                data={pieData}
                options={pieOptions}
                style={{ height: "100%" }}
              />
            </div>
          )}
        </Card>
      </div>
      <div style={{ flex: "1 1 360px", minWidth: 0 }}>
        <Card title={`Top ${COLUMN_TOP_ROOMS} phòng theo doanh thu`}>
          {loading ? (
            <div style={{ height: 320 }} />
          ) : columnRooms.length === 0 ? (
            <NoData description="Chưa có dữ liệu theo phòng" />
          ) : (
            <div style={{ height: 320 }}>
              <Chart
                key={isDark ? "bar-dark" : "bar-light"}
                type="bar"
                data={barData}
                options={barOptions}
                style={{ height: "100%" }}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
