import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Descriptions } from "antd";
import { DataTable } from "@/components/ui/table/DataTable";
import { ViewButton } from "@/components/ui/button/ViewButton";
import { EditDialog } from "@/components/ui/dialog/EditDialog";
import { ErrorPage } from "@/components/ui/error/ErrorPage";
import { NoData } from "@/components/ui/empty/NoData";
import { NoSearchResult } from "@/components/ui/empty/NoSearchResult";
import { PageContent } from "@/components/ui/page/PageContent";
import { PageHeader } from "@/components/ui/page/PageHeader";
import { PageLayout } from "@/components/ui/page/PageLayout";
import { RefreshButton } from "@/components/ui/toolbar/RefreshButton";
import { RetryButton } from "@/components/ui/error/RetryButton";
import { SearchForm } from "@/components/ui/search/SearchForm";
import { SearchInput } from "@/components/ui/search/SearchInput";
import { TableRowActions } from "@/components/ui/table/TableRowActions";
import { actionsColumn, defineColumns } from "@/components/ui/table/columnDefs";
import { useMyInvoices } from "@/features/invoices/api/invoices.hooks";
import type { Booking } from "@/features/bookings/api/bookings.types";
import { getApiErrorMessage } from "@/lib/api-error";
import { billableHours, durationHours, formatVnd } from "@/lib/money";

export default function MyInvoicesPage() {
  const { data, error, isLoading, refetch } = useMyInvoices();
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Booking | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (inv) =>
        inv.title.toLowerCase().includes(q) ||
        (inv.roomName ?? "").toLowerCase().includes(q),
    );
  }, [data, search]);

  const columns = defineColumns<Booking>([
    {
      title: "Ngày",
      key: "date",
      render: (_, inv) => dayjs(inv.startTime).format("DD/MM/YYYY"),
    },
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
    { title: "Tiêu đề", dataIndex: "title", key: "title" },
    {
      title: "Giờ tính phí",
      key: "hours",
      render: (_, inv) =>
        billableHours(inv.startTime, inv.endTime).toFixed(2),
    },
    {
      title: "Thành tiền",
      key: "amount",
      render: (_, inv) => formatVnd(inv.amount),
    },
    actionsColumn<Booking>((_, inv) => (
      <TableRowActions>
        <ViewButton onClick={() => setDetail(inv)} />
      </TableRowActions>
    )),
  ]);

  return (
    <PageLayout>
      <PageHeader title="Hóa đơn của tôi">
        <SearchForm onReset={() => setSearch("")}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm theo phòng, tiêu đề…"
          />
        </SearchForm>
      </PageHeader>

      <PageContent>
        {error ? (
          <ErrorPage
            description={getApiErrorMessage(error, "Không tải được hóa đơn")}
            extra={
              <RetryButton
                onRetry={() => void refetch()}
                loading={isLoading}
              />
            }
          />
        ) : (
          <DataTable
            rowKey="id"
            columns={columns}
            data={filtered}
            loading={isLoading}
            scroll={{ x: true }}
            emptyText={
              search.trim() ? (
                <NoSearchResult onReset={() => setSearch("")} />
              ) : (
                <NoData description="Chưa có hóa đơn (chỉ hiện lịch đã duyệt)" />
              )
            }
            toolbarExtra={
              <RefreshButton
                loading={isLoading}
                onClick={() => void refetch()}
              />
            }
          />
        )}
      </PageContent>

      <EditDialog
        title="Chi tiết hóa đơn"
        open={Boolean(detail)}
        onCancel={() => setDetail(null)}
        onOk={() => setDetail(null)}
        okText="Đóng"
        cancelButtonProps={{ style: { display: "none" } }}
      >
        {detail ? (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Tiêu đề">{detail.title}</Descriptions.Item>
            <Descriptions.Item label="Phòng">
              {detail.roomName ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              {dayjs(detail.startTime).format("DD/MM/YYYY HH:mm")} –{" "}
              {dayjs(detail.endTime).format("HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="Đơn giá / giờ">
              {formatVnd(detail.pricePerHour)}
            </Descriptions.Item>
            <Descriptions.Item label="Thời lượng thực">
              {durationHours(detail.startTime, detail.endTime).toFixed(2)} giờ
            </Descriptions.Item>
            <Descriptions.Item label="Giờ tính phí (làm tròn 30 phút)">
              {billableHours(detail.startTime, detail.endTime).toFixed(2)} giờ
            </Descriptions.Item>
            <Descriptions.Item label="Thành tiền">
              {formatVnd(detail.amount)}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </EditDialog>
    </PageLayout>
  );
}
