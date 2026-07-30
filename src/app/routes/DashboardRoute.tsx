import { useMemo, useState } from "react";
import {
  DatePicker,
  Button,
  Form,
  Select,
  TimePicker,
  Input,
  Space,
} from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { CreateDialog } from "@/components/ui/dialog/CreateDialog";
import { DataTable } from "@/components/ui/table/DataTable";
import { ErrorMessage } from "@/components/ui/error/ErrorMessage";
import { ErrorPage } from "@/components/ui/error/ErrorPage";
import { PageContent } from "@/components/ui/page/PageContent";
import { PageHeader } from "@/components/ui/page/PageHeader";
import { PageLayout } from "@/components/ui/page/PageLayout";
import { RefreshButton } from "@/components/ui/toolbar/RefreshButton";
import { RetryButton } from "@/components/ui/error/RetryButton";
import { SearchForm } from "@/components/ui/search/SearchForm";
import { SearchInput } from "@/components/ui/search/SearchInput";
import { NoData } from "@/components/ui/empty/NoData";
import { NoSearchResult } from "@/components/ui/empty/NoSearchResult";
import { defineColumns } from "@/components/ui/table/columnDefs";
import { useToast } from "@/components/ui/feedback/useFeedback";
import { createBooking } from "@/features/bookings/api/bookings.service";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useRoomSchedule } from "@/app/hooks/use-room-schedule";

interface RoomScheduleRow {
  key: number;
  roomName: string;
  capacity: number;
  bookingLines: string[];
}

function formatTimeRange(startTime: string, endTime: string): string {
  return `${dayjs(startTime).format("HH:mm")} - ${dayjs(endTime).format("HH:mm")}`;
}

const TABLE_SCROLL_X = 640;

/** App-layer route: composes auth + rooms + bookings (no cross-feature imports). */
export default function DashboardRoute() {
  const toast = useToast();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const dateStr = selectedDate.format("YYYY-MM-DD");
  const { rooms, bookings, error, isLoading, refetch } = useRoomSchedule(dateStr);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [form] = Form.useForm<{
    roomId: number;
    startTime: Dayjs;
    endTime: Dayjs;
    title: string;
  }>();

  const scheduleRows: RoomScheduleRow[] = useMemo(
    () =>
      rooms.map((room) => ({
        key: room.id,
        roomName: room.name,
        capacity: room.capacity,
        bookingLines: bookings
          .filter((booking) => booking.roomId === room.id)
          .map((booking) => {
            const statusHint =
              booking.status === "PENDING" ? " (chờ duyệt)" : "";
            return `${formatTimeRange(booking.startTime, booking.endTime)} — ${booking.title}${statusHint}`;
          }),
      })),
    [rooms, bookings],
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return scheduleRows;
    return scheduleRows.filter((row) => {
      const haystack = [row.roomName, String(row.capacity), ...row.bookingLines]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [scheduleRows, search]);

  const columns = defineColumns<RoomScheduleRow>([
    { title: "Phòng", dataIndex: "roomName", key: "roomName", width: 180 },
    {
      title: "Sức chứa",
      dataIndex: "capacity",
      key: "capacity",
      width: 100,
      align: "center",
    },
    {
      title: "Lịch đã đặt",
      key: "bookings",
      onCell: () => ({
        style: { wordBreak: "break-word", whiteSpace: "normal" },
      }),
      render: (_, row) =>
        row.bookingLines.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {row.bookingLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        ) : (
          <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>Trống cả ngày</span>
        ),
    },
  ]);

  const combineDateTime = (time: Dayjs): Dayjs =>
    selectedDate
      .hour(time.hour())
      .minute(time.minute())
      .second(0)
      .millisecond(0);

  const disabledPastDate = (current: Dayjs | null) =>
    !!current && current.isBefore(dayjs(), "day");

  const disabledPastTime = () => {
    if (!selectedDate.isSame(dayjs(), "day")) {
      return {};
    }
    const now = dayjs();
    return {
      disabledHours: () => Array.from({ length: now.hour() }, (_, i) => i),
      disabledMinutes: (selectedHour: number) =>
        selectedHour === now.hour()
          ? Array.from({ length: now.minute() }, (_, i) => i)
          : [],
    };
  };

  const handleBooking = async (values: {
    roomId: number;
    startTime: Dayjs;
    endTime: Dayjs;
    title: string;
  }) => {
    if (!user) return;

    setSubmitting(true);
    setBookingError("");

    const startDateTime = combineDateTime(values.startTime);
    const endDateTime = combineDateTime(values.endTime);

    try {
      await createBooking({
        roomId: values.roomId,
        userId: user.id,
        title: values.title,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });
      toast.success(
        user.role === "ADMIN"
          ? "Đặt phòng thành công"
          : "Đã gửi yêu cầu đặt phòng — chờ admin duyệt",
      );
      setModalOpen(false);
      form.resetFields();
      await refetch();
    } catch (err) {
      setBookingError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const openBookingModal = () => {
    setBookingError("");
    form.resetFields();
    setModalOpen(true);
  };

  const resetFilters = () => {
    setSelectedDate(dayjs());
    setSearch("");
  };

  return (
    <PageLayout>
      <PageHeader
        title="Lịch phòng họp"
        extra={
          <Button type="primary" onClick={openBookingModal}>
            Đặt phòng
          </Button>
        }
      >
        <SearchForm onReset={resetFilters}>
          <Space direction="vertical" size={4}>
            <span>Chọn ngày</span>
            <DatePicker
              value={selectedDate}
              onChange={(date) => date && setSelectedDate(date)}
              format="DD/MM/YYYY"
              style={{ width: 180 }}
              disabledDate={disabledPastDate}
              allowClear={false}
            />
          </Space>
          <Space direction="vertical" size={4}>
            <span>Tìm kiếm</span>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Tìm theo phòng, lịch đặt…"
            />
          </Space>
        </SearchForm>
      </PageHeader>

      <PageContent>
        {error ? (
          <ErrorPage
            description={
              (error as Error).message || "Không tải được lịch phòng"
            }
            extra={
              <RetryButton
                onRetry={() => void refetch()}
                loading={isLoading}
              />
            }
          />
        ) : (
        <DataTable
          key={search}
          className="room-schedule-table"
          rowKey="key"
          columns={columns}
          data={filteredRows}
          loading={isLoading}
          scroll={{ x: TABLE_SCROLL_X }}
          emptyText={
            search.trim() ? (
              <NoSearchResult onReset={() => setSearch("")} />
            ) : (
              <NoData description="Không có phòng họp" />
            )
          }
          toolbarExtra={
            <RefreshButton loading={isLoading} onClick={() => void refetch()} />
          }
        />
        )}
      </PageContent>

      <CreateDialog
        title="Đặt phòng họp"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="Đặt phòng"
      >
        <ErrorMessage
          message={bookingError}
          style={{ marginBottom: 16 }}
        />

        <Form form={form} layout="vertical" onFinish={handleBooking}>
          <Form.Item
            label="Phòng"
            name="roomId"
            rules={[{ required: true, message: "Vui lòng chọn phòng" }]}
          >
            <Select
              placeholder="Chọn phòng"
              options={rooms.map((room) => ({
                value: room.id,
                label: `${room.name} (${room.capacity} người)`,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Giờ bắt đầu"
            name="startTime"
            rules={[
              { required: true, message: "Vui lòng chọn giờ bắt đầu" },
              {
                validator: (_, value: Dayjs | undefined) => {
                  if (!value) return Promise.resolve();
                  const startDateTime = combineDateTime(value);
                  if (startDateTime.isBefore(dayjs())) {
                    return Promise.reject(
                      new Error("Không thể chọn giờ trong quá khứ"),
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <TimePicker
              format="HH:mm"
              style={{ width: "100%" }}
              disabledTime={disabledPastTime}
              hideDisabledOptions
            />
          </Form.Item>

          <Form.Item
            label="Giờ kết thúc"
            name="endTime"
            dependencies={["startTime"]}
            rules={[
              { required: true, message: "Vui lòng chọn giờ kết thúc" },
              ({ getFieldValue }) => ({
                validator: (_, value: Dayjs | undefined) => {
                  const startTime: Dayjs | undefined = getFieldValue("startTime");
                  if (!value || !startTime) return Promise.resolve();

                  const startDateTime = combineDateTime(startTime);
                  const endDateTime = combineDateTime(value);

                  if (!endDateTime.isAfter(startDateTime)) {
                    return Promise.reject(
                      new Error("Giờ kết thúc phải lớn hơn giờ bắt đầu"),
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <TimePicker
              format="HH:mm"
              style={{ width: "100%" }}
              disabledTime={disabledPastTime}
              hideDisabledOptions
            />
          </Form.Item>

          <Form.Item
            label="Tiêu đề cuộc họp"
            name="title"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input placeholder="VD: Họp planning tuần" />
          </Form.Item>
        </Form>
      </CreateDialog>
    </PageLayout>
  );
}
