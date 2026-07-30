import { useMemo, useState } from "react";
import { Card, Col, DatePicker, Row } from "antd";
import { Area, Column, Pie } from "@ant-design/plots";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { DataTable } from "@/components/ui/table/DataTable";
import { ErrorPage } from "@/components/ui/error/ErrorPage";
import { NoData } from "@/components/ui/empty/NoData";
import { PageContent } from "@/components/ui/page/PageContent";
import { PageHeader } from "@/components/ui/page/PageHeader";
import { PageLayout } from "@/components/ui/page/PageLayout";
import { RefreshButton } from "@/components/ui/toolbar/RefreshButton";
import { RetryButton } from "@/components/ui/error/RetryButton";
import { defineColumns } from "@/components/ui/table/columnDefs";
import { useMonthlyRevenue } from "@/features/revenue/api/revenue.hooks";
import type { RevenueByRoom } from "@/features/revenue/api/revenue.types";
import { RevenueKpiCards } from "@/features/revenue/components/RevenueKpiCards";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatVnd } from "@/lib/money";

/** Top slices on pie; remainder grouped as "Khác". */
const PIE_TOP_ROOMS = 8;
/** Top rooms on vertical column (absolute comparison). */
const COLUMN_TOP_ROOMS = 8;

export default function AdminRevenuePage() {
  const [month, setMonth] = useState<Dayjs>(dayjs());
  const yearMonth = month.format("YYYY-MM");
  const { data, error, isLoading, refetch } = useMonthlyRevenue(yearMonth);

  const roomColumns = defineColumns<RevenueByRoom>([
    { title: "Phòng", dataIndex: "roomName", key: "roomName" },
    { title: "Số lượt đặt", dataIndex: "bookingCount", key: "bookingCount" },
    {
      title: "Doanh thu",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => formatVnd(amount),
    },
    {
      title: "Tỷ trọng",
      dataIndex: "sharePercent",
      key: "sharePercent",
      render: (share: number) => `${Number(share ?? 0).toFixed(1)}%`,
    },
  ]);

  const dayChartData = useMemo(
    () =>
      (data?.byDay ?? []).map((d) => ({
        date: d.date,
        amount: d.amount,
      })),
    [data],
  );

  const roomsWithRevenue = useMemo(
    () => (data?.byRoom ?? []).filter((r) => r.amount > 0),
    [data],
  );

  const roomPieData = useMemo(() => {
    const top = roomsWithRevenue.slice(0, PIE_TOP_ROOMS);
    const rest = roomsWithRevenue.slice(PIE_TOP_ROOMS);
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
  }, [roomsWithRevenue]);

  const roomColumnData = useMemo(
    () =>
      roomsWithRevenue.slice(0, COLUMN_TOP_ROOMS).map((r) => ({
        room: r.roomName,
        amount: r.amount,
      })),
    [roomsWithRevenue],
  );

  const hasDayRevenue = dayChartData.some((d) => d.amount > 0);
  const hasRoomRevenue = roomsWithRevenue.length > 0;

  return (
    <PageLayout>
      <PageHeader
        title="Doanh thu"
        extra={
          <DatePicker
            picker="month"
            value={month}
            onChange={(v) => v && setMonth(v)}
            allowClear={false}
            format="MM/YYYY"
          />
        }
      />

      <PageContent>
        {error ? (
          <ErrorPage
            description={getApiErrorMessage(
              error,
              "Không tải được doanh thu",
            )}
            extra={
              <RetryButton
                onRetry={() => void refetch()}
                loading={isLoading}
              />
            }
          />
        ) : (
          <>
            <RevenueKpiCards data={data} loading={isLoading} />

            <Card
              title={`Xu hướng doanh thu theo ngày · ${yearMonth}`}
              loading={isLoading}
              style={{ marginBottom: 24 }}
            >
              {!hasDayRevenue ? (
                <NoData description="Chưa có doanh thu trong tháng này" />
              ) : (
                <Area
                  data={dayChartData}
                  xField="date"
                  yField="amount"
                  height={320}
                  shapeField="smooth"
                  style={{
                    fill: "linear-gradient(-90deg, white 0%, #69b1ff 100%)",
                    fillOpacity: 0.4,
                    lineWidth: 2,
                  }}
                  axis={{
                    y: {
                      labelFormatter: (v: string | number) =>
                        formatVnd(Number(v)),
                    },
                  }}
                  tooltip={{
                    items: [
                      {
                        channel: "y",
                        name: "Doanh thu",
                        valueFormatter: (v: number) => formatVnd(v),
                      },
                    ],
                  }}
                />
              )}
            </Card>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} lg={12}>
                <Card
                  title="Tỷ trọng doanh thu theo phòng"
                  loading={isLoading}
                >
                  {!hasRoomRevenue ? (
                    <NoData description="Chưa có dữ liệu theo phòng" />
                  ) : (
                    <Pie
                      data={roomPieData}
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
                        items: [
                          {
                            channel: "y",
                            name: "Doanh thu",
                            valueFormatter: (v: number) => formatVnd(v),
                          },
                        ],
                      }}
                    />
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card
                  title={`Top ${COLUMN_TOP_ROOMS} phòng theo doanh thu`}
                  loading={isLoading}
                >
                  {roomColumnData.length === 0 ? (
                    <NoData description="Chưa có dữ liệu theo phòng" />
                  ) : (
                    <Column
                      data={roomColumnData}
                      xField="room"
                      yField="amount"
                      height={320}
                      axis={{
                        x: {
                          labelAutoRotate: true,
                          labelAutoHide: true,
                        },
                        y: {
                          labelFormatter: (v: string | number) =>
                            formatVnd(Number(v)),
                        },
                      }}
                      tooltip={{
                        items: [
                          {
                            channel: "y",
                            name: "Doanh thu",
                            valueFormatter: (v: number) => formatVnd(v),
                          },
                        ],
                      }}
                    />
                  )}
                </Card>
              </Col>
            </Row>

            <DataTable
              rowKey="roomId"
              columns={roomColumns}
              data={data?.byRoom ?? []}
              loading={isLoading}
              scroll={{ x: true }}
              emptyText={<NoData description="Chưa có doanh thu theo phòng" />}
              toolbarExtra={
                <RefreshButton
                  loading={isLoading}
                  onClick={() => void refetch()}
                />
              }
            />
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}
