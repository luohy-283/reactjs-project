import { useMemo, useState } from "react";
import { Button, Badge } from "antd";
import dayjs from "dayjs";
import { ConfirmPopconfirm } from "@/components/ui/dialog/ConfirmPopconfirm";
import { DataTable } from "@/components/ui/table/DataTable";
import { DeleteButton } from "@/components/ui/button/DeleteButton";
import { ErrorPage } from "@/components/ui/error/ErrorPage";
import { PageContent } from "@/components/ui/page/PageContent";
import { PageHeader } from "@/components/ui/page/PageHeader";
import { PageLayout } from "@/components/ui/page/PageLayout";
import { RetryButton } from "@/components/ui/error/RetryButton";
import { SearchForm } from "@/components/ui/search/SearchForm";
import { SearchInput } from "@/components/ui/search/SearchInput";
import { NoData } from "@/components/ui/empty/NoData";
import { NoSearchResult } from "@/components/ui/empty/NoSearchResult";
import { RefreshButton } from "@/components/ui/toolbar/RefreshButton";
import { StatusBadge } from "@/components/ui/status/StatusBadge";
import { TabBar } from "@/components/ui/tabs/TabBar";
import { defineTabItems } from "@/components/ui/tabs/TabItem";
import { TableRowActions } from "@/components/ui/table/TableRowActions";
import { actionsColumn, defineColumns } from "@/components/ui/table/columnDefs";
import { useToast } from "@/components/ui/feedback/useFeedback";
import {
  approveBooking,
  cancelBooking,
  rejectBooking,
} from "@/features/bookings/api/bookings.service";
import { useBookings } from "@/features/bookings/api/bookings.hooks";
import type { Booking, BookingStatus } from "@/features/bookings/api/bookings.types";
import { getApiErrorMessage } from "@/lib/api-error";

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  CANCELLED: "Đã hủy",
};

const STATUS_COLOR: Record<BookingStatus, string> = {
  PENDING: "gold",
  APPROVED: "green",
  CANCELLED: "default",
};

function formatRange(startTime: string, endTime: string): string {
  return `${dayjs(startTime).format("DD/MM/YYYY HH:mm")} – ${dayjs(endTime).format("HH:mm")}`;
}

function matchesBooking(booking: Booking, q: string): boolean {
  const haystack = [
    booking.title,
    booking.roomName ?? `Phòng #${booking.roomId}`,
    booking.userLogin ?? `User #${booking.userId}`,
    STATUS_LABEL[booking.status],
    formatRange(booking.startTime, booking.endTime),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export default function AdminBookingsPage() {
  const toast = useToast();
  const { data: bookings, error, isLoading, refetch } = useBookings();
  const [actingId, setActingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const pending = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings
      .filter((b) => b.status === "PENDING")
      .filter((b) => !q || matchesBooking(b, q))
      .sort(
        (a, b) =>
          dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf(),
      );
  }, [bookings, search]);

  const upcomingApproved = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings
      .filter(
        (b) =>
          b.status === "APPROVED" && dayjs(b.startTime).isAfter(dayjs()),
      )
      .filter((b) => !q || matchesBooking(b, q))
      .sort(
        (a, b) =>
          dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf(),
      );
  }, [bookings, search]);

  const history = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...bookings]
      .filter((b) => !q || matchesBooking(b, q))
      .sort(
        (a, b) =>
          dayjs(b.startTime).valueOf() - dayjs(a.startTime).valueOf(),
      );
  }, [bookings, search]);

  const handleApprove = async (booking: Booking) => {
    setActingId(booking.id);
    try {
      await approveBooking(booking.id);
      toast.success("Đã duyệt yêu cầu đặt phòng");
      await refetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (booking: Booking) => {
    setActingId(booking.id);
    try {
      await rejectBooking(booking.id);
      toast.success("Đã từ chối yêu cầu đặt phòng");
      await refetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setActingId(null);
    }
  };

  const handleCancel = async (booking: Booking) => {
    setActingId(booking.id);
    try {
      await cancelBooking(booking.id);
      toast.success("Đã hủy lịch đặt phòng");
      await refetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setActingId(null);
    }
  };

  const baseColumns = defineColumns<Booking>([
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: "Phòng",
      key: "room",
      width: 160,
      render: (_, row) => row.roomName ?? `Phòng #${row.roomId}`,
    },
    {
      title: "Người đặt",
      key: "user",
      width: 140,
      render: (_, row) => row.userLogin ?? `User #${row.userId}`,
    },
    {
      title: "Thời gian",
      key: "time",
      width: 220,
      render: (_, row) => formatRange(row.startTime, row.endTime),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: BookingStatus) => (
        <StatusBadge
          status={status}
          colorMap={STATUS_COLOR}
          labelMap={STATUS_LABEL}
        />
      ),
    },
  ]);

  const pendingColumns = defineColumns<Booking>([
    ...baseColumns.filter((col) => col.key !== "status"),
    actionsColumn<Booking>(
      (_, booking) => (
        <TableRowActions>
          <ConfirmPopconfirm
            title="Duyệt yêu cầu này?"
            description="Lịch sẽ chuyển sang Đã duyệt."
            onConfirm={() => handleApprove(booking)}
            okText="Duyệt"
          >
            <Button
              type="primary"
              size="small"
              loading={actingId === booking.id}
            >
              Duyệt
            </Button>
          </ConfirmPopconfirm>
          <ConfirmPopconfirm
            title="Từ chối yêu cầu này?"
            description="Lịch sẽ bị hủy."
            onConfirm={() => handleReject(booking)}
            okText="Từ chối"
            okButtonProps={{ danger: true }}
          >
            <DeleteButton loading={actingId === booking.id}>
              Từ chối
            </DeleteButton>
          </ConfirmPopconfirm>
        </TableRowActions>
      ),
      { width: 200, fixed: "right" },
    ),
  ]);

  const upcomingColumns = defineColumns<Booking>([
    ...baseColumns.filter((col) => col.key !== "status"),
    actionsColumn<Booking>(
      (_, booking) => (
        <TableRowActions>
          <ConfirmPopconfirm
            title="Hủy lịch đã duyệt này?"
            description="Lịch sẽ chuyển sang Đã hủy."
            onConfirm={() => handleCancel(booking)}
            okText="Hủy lịch"
            cancelText="Đóng"
            okButtonProps={{ danger: true }}
          >
            <DeleteButton loading={actingId === booking.id}>
              Hủy lịch
            </DeleteButton>
          </ConfirmPopconfirm>
        </TableRowActions>
      ),
      { width: 140, fixed: "right" },
    ),
  ]);

  const resetSearch = () => setSearch("");
  const searchEmpty = Boolean(search.trim()) ? (
    <NoSearchResult onReset={resetSearch} />
  ) : null;
  const refreshExtra = (
    <RefreshButton loading={isLoading} onClick={() => void refetch()} />
  );

  return (
    <PageLayout>
      <PageHeader title="Quản lý đặt phòng">
        <SearchForm onReset={() => setSearch("")}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm theo tiêu đề, phòng, người đặt, trạng thái…"
          />
        </SearchForm>
      </PageHeader>

      <PageContent>
        {error ? (
          <ErrorPage
            description={getApiErrorMessage(
              error,
              "Không tải được lịch đặt",
            )}
            extra={
              <RetryButton
                onRetry={() => void refetch()}
                loading={isLoading}
              />
            }
          />
        ) : (
          <TabBar
            items={defineTabItems([
              {
                key: "pending",
                label: (
                  <Badge count={pending.length} offset={[10, 0]} size="small">
                    Chờ duyệt
                  </Badge>
                ),
                children: (
                  <DataTable
                    key={`pending-${search}`}
                    rowKey="id"
                    columns={pendingColumns}
                    data={pending}
                    loading={isLoading}
                    emptyText={
                      searchEmpty ?? (
                        <NoData description="Không có yêu cầu chờ duyệt" />
                      )
                    }
                    scroll={{ x: 900 }}
                    toolbarExtra={refreshExtra}
                  />
                ),
              },
              {
                key: "upcoming",
                label: (
                  <Badge
                    count={upcomingApproved.length}
                    offset={[10, 0]}
                    size="small"
                    color="blue"
                  >
                    Đã duyệt (chưa diễn ra)
                  </Badge>
                ),
                children: (
                  <DataTable
                    key={`upcoming-${search}`}
                    rowKey="id"
                    columns={upcomingColumns}
                    data={upcomingApproved}
                    loading={isLoading}
                    emptyText={
                      searchEmpty ?? (
                        <NoData description="Không có lịch đã duyệt sắp tới" />
                      )
                    }
                    scroll={{ x: 900 }}
                    toolbarExtra={refreshExtra}
                  />
                ),
              },
              {
                key: "all",
                label: "Lịch sử",
                children: (
                  <DataTable
                    key={`history-${search}`}
                    rowKey="id"
                    columns={baseColumns}
                    data={history}
                    loading={isLoading}
                    emptyText={
                      searchEmpty ?? (
                        <NoData description="Chưa có lịch đặt nào" />
                      )
                    }
                    scroll={{ x: 900 }}
                    toolbarExtra={refreshExtra}
                  />
                ),
              },
            ])}
          />
        )}
      </PageContent>
    </PageLayout>
  );
}
