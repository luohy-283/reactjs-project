import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Button, Descriptions, Space } from "antd";
import { DataTable } from "@/components/ui/table/DataTable";
import { ViewButton } from "@/components/ui/button/ViewButton";
import { EditDialog } from "@/components/ui/dialog/EditDialog";
import { FetchError } from "@/components/ui/error/FetchError";
import { NoData } from "@/components/ui/empty/NoData";
import { NoSearchResult } from "@/components/ui/empty/NoSearchResult";
import { useToast } from "@/components/ui/feedback/useFeedback";
import { PageContent } from "@/components/ui/page/PageContent";
import { PageHeader } from "@/components/ui/page/PageHeader";
import { PageLayout } from "@/components/ui/page/PageLayout";
import { SearchForm } from "@/components/ui/search/SearchForm";
import { SearchInput } from "@/components/ui/search/SearchInput";
import { StatusFilter } from "@/components/ui/search/StatusFilter";
import { StatusBadge } from "@/components/ui/status/StatusBadge";
import { ExportButton } from "@/components/ui/toolbar/ExportButton";
import { RefreshButton } from "@/components/ui/toolbar/RefreshButton";
import { TableRowActions } from "@/components/ui/table/TableRowActions";
import {
  actionsColumn,
  defineColumns,
  sortableColumn,
} from "@/components/ui/table/columnDefs";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useMyInvoicesPage } from "@/features/invoices/api/invoices.hooks";
import { markInvoicePaid } from "@/features/invoices/api/invoices.service";
import {
  PAYMENT_COLOR_MAP,
  PAYMENT_LABEL_MAP,
  PAYMENT_STATUS_OPTIONS,
} from "@/features/invoices/lib/paymentStatus";
import { getApiErrorMessage } from "@/lib/api-error";
import type { Booking, PaymentStatus } from "@/lib/types/booking";
import { formatDateTimeRange } from "@/lib/datetime";
import { billableHours, durationHours, formatVnd } from "@/lib/money";
import { useAuthenticatedExport } from "@/lib/useAuthenticatedExport";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useServerTableQuery } from "@/lib/useServerTableQuery";

export default function MyInvoicesPage() {
  const toast = useToast();
  const { user } = useAuth();
  const canMarkPaid = user?.role === "ADMIN" || user?.role === "MANAGER";

  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | "ALL">(
    "ALL",
  );
  const [markingId, setMarkingId] = useState<number | null>(null);
  const debouncedQ = useDebouncedValue(search.trim(), 300);
  const { query, setQuery, pageParams, resetPage } = useServerTableQuery();

  useEffect(() => {
    resetPage();
  }, [debouncedQ, paymentFilter, resetPage]);

  const q = debouncedQ || undefined;
  const paymentStatus =
    paymentFilter === "ALL" ? undefined : paymentFilter;
  const pageOpts = { ...pageParams, q, paymentStatus };
  const { data: invoicesPage, error, isLoading, refetch } =
    useMyInvoicesPage(pageOpts);
  const [detail, setDetail] = useState<Booking | null>(null);
  const { exporting, runExport } = useAuthenticatedExport();

  const resetSearch = () => {
    setSearch("");
    setPaymentFilter("ALL");
    resetPage();
  };

  const handleMarkPaid = useCallback(
    async (invoice: Booking) => {
      setMarkingId(invoice.id);
      try {
        await markInvoicePaid(invoice.id);
        toast.success("Đã đánh dấu đã trả");
        await refetch();
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Thao tác thất bại"));
      } finally {
        setMarkingId(null);
      }
    },
    [refetch, toast],
  );

  const columns = useMemo(
    () =>
      defineColumns<Booking>([
        sortableColumn<Booking>({
          title: "Ngày",
          dataIndex: "startTime",
          key: "startTime",
          fixed: "left",
          width: 110,
          render: (_, inv) => dayjs(inv.startTime).format("DD/MM/YYYY"),
        }),
        {
          title: "Giờ",
          key: "time",
          width: 120,
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
          width: 110,
          render: (_, inv) =>
            billableHours(inv.startTime, inv.endTime).toFixed(2),
        },
        sortableColumn<Booking>({
          title: "Thành tiền",
          dataIndex: "amount",
          key: "amount",
          render: (_, inv) => formatVnd(inv.amount),
        }),
        {
          title: "Thanh toán",
          key: "paymentStatus",
          width: 110,
          render: (_, inv) => (
            <StatusBadge
              status={inv.paymentStatus ?? "UNPAID"}
              colorMap={PAYMENT_COLOR_MAP}
              labelMap={PAYMENT_LABEL_MAP}
            />
          ),
        },
        {
          title: "Duyệt bởi",
          key: "approvedBy",
          width: 140,
          render: (_, inv) =>
            inv.approvedByFullName ?? inv.approvedByLogin ?? "—",
        },
        actionsColumn<Booking>((_, inv) => (
          <TableRowActions>
            <ViewButton onClick={() => setDetail(inv)} />
            {canMarkPaid && (inv.paymentStatus ?? "UNPAID") === "UNPAID" ? (
              <Button
                type="link"
                size="small"
                loading={markingId === inv.id}
                onClick={() => void handleMarkPaid(inv)}
              >
                Đánh dấu đã trả
              </Button>
            ) : null}
          </TableRowActions>
        )),
      ]),
    [canMarkPaid, handleMarkPaid, markingId],
  );

  return (
    <PageLayout>
      <PageHeader title="Hóa đơn của tôi">
        <SearchForm onReset={resetSearch}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm theo phòng, tiêu đề…"
          />
          <StatusFilter<PaymentStatus>
            value={paymentFilter}
            onChange={setPaymentFilter}
            options={PAYMENT_STATUS_OPTIONS}
            allLabel="Tất cả thanh toán"
            placeholder="Thanh toán"
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
            scroll={{ x: 1200 }}
            enableColumnSetting
            enableRowSelection
            enableColumnDrag
            enableMultiSort
            emptyText={
              q || paymentStatus ? (
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
              <Space size={8}>
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
              </Space>
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
              {formatDateTimeRange(detail.startTime, detail.endTime)}
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
            <Descriptions.Item label="Thanh toán">
              <StatusBadge
                status={detail.paymentStatus ?? "UNPAID"}
                colorMap={PAYMENT_COLOR_MAP}
                labelMap={PAYMENT_LABEL_MAP}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Duyệt bởi">
              {detail.approvedByFullName ?? detail.approvedByLogin ?? "—"}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </EditDialog>
    </PageLayout>
  );
}
