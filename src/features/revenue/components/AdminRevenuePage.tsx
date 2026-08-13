import { useEffect, useMemo, useState } from "react";
import { DatePicker, Space } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { DataTable } from "@/components/ui/table/DataTable";
import { FetchError } from "@/components/ui/error/FetchError";
import { NoData } from "@/components/ui/empty/NoData";
import { NoSearchResult } from "@/components/ui/empty/NoSearchResult";
import { PageContent } from "@/components/ui/page/PageContent";
import { PageHeader } from "@/components/ui/page/PageHeader";
import { PageLayout } from "@/components/ui/page/PageLayout";
import { ExportButton } from "@/components/ui/toolbar/ExportButton";
import { RefreshButton } from "@/components/ui/toolbar/RefreshButton";
import { SearchForm } from "@/components/ui/search/SearchForm";
import { SearchInput } from "@/components/ui/search/SearchInput";
import {
  defineColumns,
  sortableColumn,
} from "@/components/ui/table/columnDefs";
import {
  useMonthlyRevenue,
  useRevenueByRoomPage,
} from "@/features/revenue/api/revenue.hooks";
import type { RevenueByRoom } from "@/features/revenue/api/revenue.types";
import { RevenueKpiCards } from "@/features/revenue/components/RevenueKpiCards";
import { RevenueRoomCharts } from "@/features/revenue/components/RevenueRoomCharts";
import { RevenueTrendArea } from "@/features/revenue/components/RevenueTrendArea";
import { formatVnd } from "@/lib/money";
import { useAuthenticatedExport } from "@/lib/useAuthenticatedExport";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useServerTableQuery } from "@/lib/useServerTableQuery";

export default function AdminRevenuePage() {
  const [month, setMonth] = useState<Dayjs>(dayjs());
  const [search, setSearch] = useState("");
  const debouncedQ = useDebouncedValue(search.trim(), 300);
  const { query, setQuery, pageParams, resetPage } =
    useServerTableQuery();

  useEffect(() => {
    resetPage();
  }, [debouncedQ, resetPage]);

  const { exporting, runExport } = useAuthenticatedExport();
  const yearMonth = month.format("YYYY-MM");
  const q = debouncedQ || undefined;
  const {
    data,
    error,
    isLoading,
    refetch,
  } = useMonthlyRevenue(yearMonth);
  const {
    data: byRoomPage,
    error: byRoomError,
    isLoading: byRoomLoading,
    refetch: refetchByRoom,
  } = useRevenueByRoomPage({
    yearMonth,
    ...pageParams,
    q,
  });

  const roomColumns = defineColumns<RevenueByRoom>([
    sortableColumn<RevenueByRoom>({
      title: "Tên phòng",
      dataIndex: "roomName",
      key: "roomName",
    }),
    sortableColumn<RevenueByRoom>({
      title: "Số lượt đặt",
      dataIndex: "bookingCount",
      key: "bookingCount",
    }),
    sortableColumn<RevenueByRoom>({
      title: "Gross",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => formatVnd(amount),
    }),
    sortableColumn<RevenueByRoom>({
      title: "Chi phí TB",
      dataIndex: "equipmentCost",
      key: "equipmentCost",
      render: (v: number | undefined) => formatVnd(Number(v ?? 0)),
    }),
    sortableColumn<RevenueByRoom>({
      title: "Net",
      dataIndex: "netAmount",
      key: "netAmount",
      render: (v: number | undefined) => formatVnd(Number(v ?? 0)),
    }),
    sortableColumn<RevenueByRoom>({
      title: "Tỷ trọng",
      dataIndex: "sharePercent",
      key: "sharePercent",
      render: (share: number) => `${Number(share ?? 0).toFixed(1)}%`,
    }),
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

  const resetSearch = () => {
    setSearch("");
    resetPage();
  };

  const refetchAll = async () => {
    await Promise.all([refetch(), refetchByRoom()]);
  };

  const pageError = error ?? byRoomError;
  const pageLoading = isLoading || byRoomLoading;

  return (
    <PageLayout>
      <PageHeader
        title="Doanh thu"
        extra={
          <Space>
            <ExportButton
              loading={exporting}
              onClick={() =>
                void runExport(
                  "/admin/revenue/export",
                  `revenue-${yearMonth}.csv`,
                  { yearMonth },
                )
              }
            >
              Xuất CSV
            </ExportButton>
            <DatePicker
              picker="month"
              value={month}
              onChange={(v) => {
                if (!v) return;
                setMonth(v);
                resetPage();
              }}
              allowClear={false}
              format="MM/YYYY"
            />
          </Space>
        }
      />

      <PageContent>
        {pageError ? (
          <FetchError
            error={pageError}
            fallback="Không tải được doanh thu"
            onRetry={() => void refetchAll()}
            loading={pageLoading}
          />
        ) : (
          <>
            <RevenueKpiCards data={data} loading={isLoading} />
            <RevenueTrendArea
              yearMonth={yearMonth}
              loading={isLoading}
              data={dayChartData}
            />
            <RevenueRoomCharts
              loading={isLoading}
              roomsWithRevenue={roomsWithRevenue}
            />
            <div style={{ marginBottom: 16 }}>
              <SearchForm onReset={resetSearch}>
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Tìm theo tên phòng…"
                />
              </SearchForm>
            </div>
            <DataTable
              rowKey="roomId"
              columns={roomColumns}
              data={byRoomPage.items}
              loading={byRoomLoading}
              scroll={{ x: true }}
              emptyText={
                q ? (
                  <NoSearchResult onReset={resetSearch} />
                ) : (
                  <NoData description="Chưa có doanh thu theo phòng" />
                )
              }
              serverSide
              total={byRoomPage.totalElements}
              page={query.page}
              pageSize={query.pageSize}
              sort={query.sort}
              onQueryChange={setQuery}
              toolbarExtra={
                <RefreshButton
                  loading={pageLoading}
                  onClick={() => void refetchAll()}
                />
              }
            />
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}
