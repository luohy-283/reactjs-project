import { useEffect, useMemo, useState } from "react";
import { Badge } from "antd";
import { useLocation } from "react-router";
import { ConfirmPopconfirm } from "@/components/ui/dialog/ConfirmPopconfirm";
import { DataTable } from "@/components/ui/table/DataTable";
import { DeleteButton } from "@/components/ui/button/DeleteButton";
import { FetchError } from "@/components/ui/error/FetchError";
import { PageContent } from "@/components/ui/page/PageContent";
import { PageHeader } from "@/components/ui/page/PageHeader";
import { PageLayout } from "@/components/ui/page/PageLayout";
import { SearchForm } from "@/components/ui/search/SearchForm";
import { SearchInput } from "@/components/ui/search/SearchInput";
import { StatusFilter } from "@/components/ui/search/StatusFilter";
import { NoData } from "@/components/ui/empty/NoData";
import { NoSearchResult } from "@/components/ui/empty/NoSearchResult";
import { RefreshButton } from "@/components/ui/toolbar/RefreshButton";
import { StatusBadge } from "@/components/ui/status/StatusBadge";
import { TabBar } from "@/components/ui/tabs/TabBar";
import { defineTabItems } from "@/components/ui/tabs/TabItem";
import { TableRowActions } from "@/components/ui/table/TableRowActions";
import { ApproveRejectActions } from "@/components/ui/table/ApproveRejectActions";
import {
  actionsColumn,
  defineColumns,
  sortableColumn,
} from "@/components/ui/table/columnDefs";
import { useToast } from "@/components/ui/feedback/useFeedback";
import {
  approveBooking,
  cancelBooking,
  getBooking,
  rejectBooking,
} from "@/features/bookings/api/bookings.service";
import {
  useBookingsCount,
  useBookingsPage,
} from "@/features/bookings/api/bookings.hooks";
import type { Booking, BookingStatus } from "@/features/bookings/api/bookings.types";
import { getApiErrorMessage, isAbortError } from "@/lib/api-error";
import { formatDateTimeRange } from "@/lib/datetime";
import { parseNotificationFlash } from "@/lib/notificationNav";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useServerTableQuery } from "@/lib/useServerTableQuery";
import { useTableRowHighlight } from "@/lib/useTableRowHighlight";
import { useUrlTab } from "@/lib/useUrlTab";

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
};

const STATUS_COLOR: Record<BookingStatus, string> = {
  PENDING: "gold",
  APPROVED: "green",
  CANCELLED: "default",
  EXPIRED: "volcano",
};

const BOOKING_STATUS_OPTIONS = [
  { value: "PENDING" as const, label: "Chờ duyệt" },
  { value: "APPROVED" as const, label: "Đã duyệt" },
  { value: "CANCELLED" as const, label: "Đã hủy" },
  { value: "EXPIRED" as const, label: "Hết hạn" },
];

type BookingTab = "pending" | "upcoming" | "all";

function parseBookingTab(raw: string | null): BookingTab {
  if (raw === "upcoming" || raw === "all") return raw;
  return "pending";
}

const BOOKING_HIGHLIGHT_TABS = ["pending"] as const;

export default function AdminBookingsPage() {
  const toast = useToast();
  const location = useLocation();
  const { tab, setTab, searchParams, setSearchParams } = useUrlTab({
    defaultTab: "pending",
    parse: parseBookingTab,
    highlightTabs: BOOKING_HIGHLIGHT_TABS,
  });
  const { query, setQuery, pageParams, resetPage, resetQuery } =
    useServerTableQuery();
  const [actingId, setActingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const debouncedQ = useDebouncedValue(search.trim(), 300);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">(
    "ALL",
  );
  /** Resolved deep-link pin: only set from fetch callbacks, reset during render. */
  const [pinState, setPinState] = useState<{
    id: number;
    booking: Booking | null;
  } | null>(null);

  const searchQ = debouncedQ;
  const hasTextSearch = Boolean(searchQ);
  const highlightRaw = searchParams.get("highlight");
  const highlightId =
    highlightRaw && /^\d+$/.test(highlightRaw) ? Number(highlightRaw) : null;
  const pinResolveKey = tab === "pending" ? highlightId : null;

  useEffect(() => {
    resetPage();
  }, [debouncedQ, resetPage]);

  // Reset pin when highlight/tab context changes (React “adjust state while rendering”).
  const [prevPinResolveKey, setPrevPinResolveKey] = useState(pinResolveKey);
  if (pinResolveKey !== prevPinResolveKey) {
    setPrevPinResolveKey(pinResolveKey);
    setPinState(null);
  }

  const pageOpts = {
    ...pageParams,
    ...(tab === "pending" ? { status: "PENDING" as const } : {}),
    ...(tab === "upcoming" ? { upcoming: true as const } : {}),
    ...(tab === "all" && statusFilter !== "ALL"
      ? { status: statusFilter }
      : {}),
    ...(searchQ ? { q: searchQ } : {}),
  };

  const { data: pageResult, error, isLoading, refetch } =
    useBookingsPage(pageOpts);
  const { data: pendingCount } = useBookingsCount({ status: "PENDING" });
  const { data: upcomingCount } = useBookingsCount({ upcoming: true });

  const highlightOnPage =
    pinResolveKey != null &&
    pageResult.items.some((b) => b.id === pinResolveKey);

  const pinnedBooking =
    pinState &&
    pinResolveKey === pinState.id &&
    !highlightOnPage
      ? pinState.booking
      : null;

  const highlightReady =
    pinResolveKey == null ||
    highlightOnPage ||
    pinState?.id === pinResolveKey;

  useEffect(() => {
    if (pinResolveKey == null || isLoading || highlightOnPage) return;
    if (pinState?.id === pinResolveKey) return;

    const controller = new AbortController();
    const id = pinResolveKey;
    void getBooking(id, controller.signal)
      .then((booking) => {
        if (!controller.signal.aborted) {
          setPinState({
            id,
            booking: booking.status === "PENDING" ? booking : null,
          });
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted && !isAbortError(err)) {
          setPinState({ id, booking: null });
        }
      });
    return () => controller.abort();
  }, [pinResolveKey, isLoading, highlightOnPage, pinState?.id]);

  const tableRows = useMemo(() => {
    if (
      pinnedBooking &&
      !pageResult.items.some((b) => b.id === pinnedBooking.id)
    ) {
      return [pinnedBooking, ...pageResult.items];
    }
    return pageResult.items;
  }, [pageResult.items, pinnedBooking]);

  const flashKey = parseNotificationFlash(location.state);

  const { onRow, rowClassName } = useTableRowHighlight({
    searchParams,
    setSearchParams,
    ready: tab === "pending" && !isLoading && highlightReady,
    rowIds: tableRows.map((b) => b.id),
    missingMessage:
      "Yêu cầu đặt phòng không còn trong danh sách chờ duyệt (có thể đã được xử lý).",
    flashKey,
  });

  const handleApprove = async (booking: Booking) => {
    setActingId(booking.id);
    try {
      await approveBooking(booking.id);
      toast.success("Đã duyệt yêu cầu đặt phòng");
      await refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Thao tác thất bại"));
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
      toast.error(getApiErrorMessage(err, "Thao tác thất bại"));
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
      toast.error(getApiErrorMessage(err, "Thao tác thất bại"));
    } finally {
      setActingId(null);
    }
  };

  const baseColumns = defineColumns<Booking>([
    sortableColumn<Booking>({
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    }),
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
    sortableColumn<Booking>({
      title: "Thời gian",
      dataIndex: "startTime",
      key: "startTime",
      width: 220,
      render: (_, row) => formatDateTimeRange(row.startTime, row.endTime),
    }),
    sortableColumn<Booking>({
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
    }),
  ]);

  const pendingColumns = defineColumns<Booking>([
    ...baseColumns.filter((col) => col.key !== "status"),
    actionsColumn<Booking>(
      (_, booking) => (
        <ApproveRejectActions
          loading={actingId === booking.id}
          onApprove={() => void handleApprove(booking)}
          onReject={() => void handleReject(booking)}
          approveConfirm={{
            title: "Duyệt yêu cầu này?",
            description: "Lịch sẽ chuyển sang Đã duyệt.",
          }}
          rejectConfirm={{
            title: "Từ chối yêu cầu này?",
            description: "Lịch sẽ bị hủy.",
          }}
        />
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

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    resetPage();
  };
  const hasFilters =
    hasTextSearch || (tab === "all" && statusFilter !== "ALL");
  const searchEmpty = hasFilters ? (
    <NoSearchResult onReset={resetFilters} />
  ) : null;
  const refreshExtra = (
    <RefreshButton loading={isLoading} onClick={() => void refetch()} />
  );

  const tabItems = defineTabItems([
    {
      key: "pending",
      label: (
        <Badge count={pendingCount} offset={[10, 0]} size="small">
          Chờ duyệt
        </Badge>
      ),
    },
    {
      key: "upcoming",
      label: (
        <Badge
          count={upcomingCount}
          offset={[10, 0]}
          size="small"
          color="blue"
        >
          Đã duyệt (chưa diễn ra)
        </Badge>
      ),
    },
    { key: "all", label: "Lịch sử" },
  ]);

  const activeColumns =
    tab === "pending"
      ? pendingColumns
      : tab === "upcoming"
        ? upcomingColumns
        : baseColumns;

  const emptyDefault =
    tab === "pending"
      ? "Không có yêu cầu chờ duyệt"
      : tab === "upcoming"
        ? "Không có lịch đã duyệt sắp tới"
        : "Chưa có lịch đặt nào";

  const onTabChange = (key: string) => {
    setTab(key);
    resetQuery();
  };

  return (
    <PageLayout>
      <PageHeader title="Quản lý đặt phòng" />

      <PageContent>
        {error ? (
          <FetchError
            error={error}
            fallback="Không tải được lịch đặt"
            onRetry={() => void refetch()}
            loading={isLoading}
          />
        ) : (
          <>
            <TabBar
              activeKey={tab}
              onChange={onTabChange}
              items={tabItems}
              style={{ marginBottom: 16 }}
            />

            <div style={{ marginBottom: 16 }}>
              <SearchForm onReset={resetFilters}>
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Tìm theo tiêu đề, phòng, người đặt…"
                />
                {tab === "all" ? (
                  <StatusFilter<BookingStatus>
                    value={statusFilter}
                    onChange={(value) => {
                      setStatusFilter(value);
                      resetPage();
                    }}
                    options={BOOKING_STATUS_OPTIONS}
                    allLabel="Tất cả trạng thái"
                  />
                ) : null}
              </SearchForm>
            </div>

            <DataTable<Booking>
              rowKey="id"
              columns={activeColumns}
              data={tableRows}
              loading={isLoading}
              emptyText={
                searchEmpty ?? <NoData description={emptyDefault} />
              }
              scroll={{ x: 900 }}
              serverSide
              total={pageResult.totalElements}
              page={query.page}
              pageSize={query.pageSize}
              sort={query.sort}
              onQueryChange={setQuery}
              onRow={tab === "pending" ? onRow : undefined}
              rowClassName={tab === "pending" ? rowClassName : undefined}
              toolbarExtra={refreshExtra}
            />
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}
