import { useEffect, useState, type ReactNode } from "react";
import dayjs from "dayjs";
import { DataTable } from "@/components/ui/table/DataTable";
import { ViewButton } from "@/components/ui/button/ViewButton";
import { ViewDialog } from "@/components/ui/dialog/ViewDialog";
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
import { TableRowActions } from "@/components/ui/table/TableRowActions";
import {
  actionsColumn,
  defineColumns,
  sortableColumn,
} from "@/components/ui/table/columnDefs";
import { useMyInvoicesPage } from "@/features/invoices/api/invoices.hooks";
import type { Booking } from "@/lib/types/booking";
import { formatDateTimeRange } from "@/lib/datetime";
import { billableHours, durationHours, formatVnd } from "@/lib/money";
import { useAuthenticatedExport } from "@/lib/useAuthenticatedExport";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useServerTableQuery } from "@/lib/useServerTableQuery";

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "8px 0",
        borderBottom: "1px solid var(--p-content-border-color, #e5e7eb)",
      }}
    >
      <dt style={{ width: 200, flexShrink: 0, fontWeight: 500, opacity: 0.8 }}>
        {label}
      </dt>
      <dd style={{ margin: 0, flex: 1 }}>{children}</dd>
    </div>
  );
}

export default function MyInvoicesPage() {
  const [search, setSearch] = useState("");
  const debouncedQ = useDebouncedValue(search.trim(), 300);
  const { query, setQuery, pageParams, resetPage } =
    useServerTableQuery();

  useEffect(() => {
    resetPage();
  }, [debouncedQ, resetPage]);

  const q = debouncedQ || undefined;
  const pageOpts = { ...pageParams, q };
  const { data: invoicesPage, error, isLoading, refetch } =
    useMyInvoicesPage(pageOpts);
  const [detail, setDetail] = useState<Booking | null>(null);
  const { exporting, runExport } = useAuthenticatedExport();

  const resetSearch = () => {
    setSearch("");
    resetPage();
  };

  const columns = defineColumns<Booking>([
    sortableColumn<Booking>({
      title: "Ngày",
      dataIndex: "startTime",
      key: "startTime",
      render: (_, inv) => dayjs(inv.startTime).format("DD/MM/YYYY"),
    }),
    {
      title: "Giờ",
      key: "time",
      render: (_, inv) =>
        `${dayjs(inv.startTime).format("HH:mm")} – ${dayjs(inv.endTime).format("HH:mm")}`,
    },
    {
      title: "Phòng",
      dataIndex: "roomName",
      key: "roomName",
      render: (name: string | undefined) => name ?? "—",
    },
    sortableColumn<Booking>({
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
    }),
    {
      title: "Giờ tính phí",
      key: "hours",
      render: (_, inv) =>
        billableHours(inv.startTime, inv.endTime).toFixed(2),
    },
    sortableColumn<Booking>({
      title: "Thành tiền",
      dataIndex: "amount",
      key: "amount",
      render: (_, inv) => formatVnd(inv.amount),
    }),
    actionsColumn<Booking>((_, inv) => (
      <TableRowActions>
        <ViewButton onClick={() => setDetail(inv)} />
      </TableRowActions>
    )),
  ]);

  return (
    <PageLayout>
      <PageHeader title="Hóa đơn của tôi">
        <SearchForm onReset={resetSearch}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm theo phòng, tiêu đề…"
          />
        </SearchForm>
      </PageHeader>

      <PageContent>
        {error ? (
          <FetchError
            error={error}
            fallback="Không tải được hóa đơn"
            onRetry={() => void refetch()}
            loading={isLoading}
          />
        ) : (
          <DataTable
            rowKey="id"
            columns={columns}
            data={invoicesPage.items}
            loading={isLoading}
            scroll={{ x: true }}
            emptyText={
              q ? (
                <NoSearchResult onReset={resetSearch} />
              ) : (
                <NoData description="Chưa có hóa đơn (chỉ hiện lịch đã duyệt)" />
              )
            }
            serverSide
            total={invoicesPage.totalElements}
            page={query.page}
            pageSize={query.pageSize}
            sort={query.sort}
            onQueryChange={setQuery}
            toolbarExtra={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ExportButton
                  loading={exporting}
                  onClick={() =>
                    void runExport("/account/invoices/export", "invoices.csv")
                  }
                >
                  Xuất CSV
                </ExportButton>
                <RefreshButton
                  loading={isLoading}
                  onClick={() => void refetch()}
                />
              </div>
            }
          />
        )}
      </PageContent>

      <ViewDialog
        title="Chi tiết hóa đơn"
        open={Boolean(detail)}
        onCancel={() => setDetail(null)}
        onOk={() => setDetail(null)}
        okText="Đóng"
      >
        {detail ? (
          <dl style={{ margin: 0 }}>
            <DetailRow label="Tiêu đề">{detail.title}</DetailRow>
            <DetailRow label="Phòng">{detail.roomName ?? "—"}</DetailRow>
            <DetailRow label="Thời gian">
              {formatDateTimeRange(detail.startTime, detail.endTime)}
            </DetailRow>
            <DetailRow label="Đơn giá / giờ">
              {formatVnd(detail.pricePerHour)}
            </DetailRow>
            <DetailRow label="Thời lượng thực">
              {durationHours(detail.startTime, detail.endTime).toFixed(2)} giờ
            </DetailRow>
            <DetailRow label="Giờ tính phí (làm tròn 30 phút)">
              {billableHours(detail.startTime, detail.endTime).toFixed(2)} giờ
            </DetailRow>
            <DetailRow label="Thành tiền">{formatVnd(detail.amount)}</DetailRow>
          </dl>
        ) : null}
      </ViewDialog>
    </PageLayout>
  );
}
