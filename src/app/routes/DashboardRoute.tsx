import { useMemo, useState } from "react";
import {
  DatePicker,
  Button,
  Form,
  Select,
  TimePicker,
  Input,
  Space,
  Typography,
} from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { CreateDialog } from "@/components/ui/dialog/CreateDialog";
import { ErrorMessage } from "@/components/ui/error/ErrorMessage";
import { FetchError } from "@/components/ui/error/FetchError";
import { PageContent } from "@/components/ui/page/PageContent";
import { PageHeader } from "@/components/ui/page/PageHeader";
import { PageLayout } from "@/components/ui/page/PageLayout";
import { RefreshButton } from "@/components/ui/toolbar/RefreshButton";
import { SearchForm } from "@/components/ui/search/SearchForm";
import { SearchInput } from "@/components/ui/search/SearchInput";
import { NoSearchResult } from "@/components/ui/empty/NoSearchResult";
import { useToast } from "@/components/ui/feedback/useFeedback";
import { RoomDayTimeline } from "@/app/components/RoomDayTimeline";
import { Room3DDialog } from "@/app/components/Room3DDialog";
import type { Room } from "@/features/rooms/api/rooms.types";
import { EQUIPMENT_CATEGORIES } from "@/features/equipment/api/equipment.types";
import type { EquipmentCategory } from "@/features/equipment/api/equipment.types";

import { createBooking } from "@/features/bookings/api/bookings.service";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useRoomSchedule } from "@/app/hooks/use-room-schedule";
import { estimateBookingAmount, formatVnd } from "@/lib/money";
import { toApiDateTime } from "@/lib/datetime";
import {
  computeDensityLabel,
  formatRoomEquipment,
  layoutTypeLabel,
} from "@/lib/room-layout";

/** App-layer route: composes auth + rooms + bookings (no cross-feature imports). */
export default function DashboardRoute() {
  const toast = useToast();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const dateStr = selectedDate.format("YYYY-MM-DD");
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentCategory[]>(
    [],
  );
  const { rooms, bookings, error, isLoading, refetch } = useRoomSchedule(
    dateStr,
    { equipmentCategory: equipmentFilter },
  );
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
  const [room3d, setRoom3d] = useState<Room | null>(null);

  const watchedRoomId = Form.useWatch("roomId", form);
  const watchedStart = Form.useWatch("startTime", form);
  const watchedEnd = Form.useWatch("endTime", form);

  const filteredRooms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((room) => {
      const roomBookings = bookings.filter((b) => b.roomId === room.id);
      const haystack = [
        room.name,
        String(room.capacity),
        ...roomBookings.map((b) => `${b.title} ${b.userLogin ?? ""}`),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rooms, bookings, search]);

  const filteredBookings = useMemo(() => {
    const ids = new Set(filteredRooms.map((r) => r.id));
    return bookings.filter((b) => ids.has(b.roomId));
  }, [bookings, filteredRooms]);

  const combineDateTime = (time: Dayjs): Dayjs =>
    selectedDate
      .hour(time.hour())
      .minute(time.minute())
      .second(0)
      .millisecond(0);

  const estimatedFee = useMemo(() => {
    const room = rooms.find((r) => r.id === watchedRoomId);
    if (!room || !watchedStart || !watchedEnd) return null;
    const startIso = toApiDateTime(combineDateTime(watchedStart));
    const endIso = toApiDateTime(combineDateTime(watchedEnd));
    if (!dayjs(endIso).isAfter(dayjs(startIso))) return null;
    return estimateBookingAmount(room.pricePerHour, startIso, endIso);
  }, [rooms, watchedRoomId, watchedStart, watchedEnd, selectedDate]);

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
      const created = await createBooking({
        roomId: values.roomId,
        title: values.title,
        startTime: toApiDateTime(startDateTime),
        endTime: toApiDateTime(endDateTime),
      });
      toast.success(
        created.status === "APPROVED"
          ? "Đặt phòng thành công"
          : "Đã gửi yêu cầu đặt phòng — chờ duyệt",
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

  const openBookingModal = (prefill?: {
    roomId: number;
    startHour: number;
    startMinute: number;
  }) => {
    setBookingError("");
    form.resetFields();
    if (prefill) {
      // Use dashboard selected date — not `dayjs()` (today) — so TimePicker/API stay aligned.
      const start = selectedDate
        .hour(prefill.startHour)
        .minute(prefill.startMinute)
        .second(0)
        .millisecond(0);
      const end = start.add(1, "hour");
      form.setFieldsValue({
        roomId: prefill.roomId,
        startTime: start,
        endTime: end,
      });
    }
    setModalOpen(true);
  };

  const resetFilters = () => {
    setSelectedDate(dayjs());
    setSearch("");
    setEquipmentFilter([]);
  };

  const searchMiss =
    (Boolean(search.trim()) || equipmentFilter.length > 0) &&
    !isLoading &&
    filteredRooms.length === 0;

  const roomSelectOptions = filteredRooms.map((room) => {
    const density = computeDensityLabel(
      room.floorWidthM,
      room.floorDepthM,
      room.capacity,
    );
    const layout = layoutTypeLabel(room.layoutType);
    const eq = formatRoomEquipment(
      room.equipmentNames,
      room.equipmentCategories,
    );
    return {
      value: room.id,
      label: `${room.name} · ${room.capacity} chỗ · ${layout}/${density} · ${eq} · ${formatVnd(room.pricePerHour)}/giờ`,
    };
  });

  return (
    <>
    <PageLayout>
      <PageHeader
        title="Lịch phòng họp"
        extra={
          <Space size={12}>
            <RefreshButton loading={isLoading} onClick={() => void refetch()} />
            <Button type="primary" onClick={() => openBookingModal()}>
              Đặt phòng
            </Button>
          </Space>
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
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm theo phòng, lịch đặt…"
          />
          <Space direction="vertical" size={4} style={{ minWidth: 260 }}>
            <span>Thiết bị</span>
            <Select
              mode="multiple"
              allowClear
              placeholder="Chọn thiết bị…"
              value={equipmentFilter}
              onChange={(v) => setEquipmentFilter(v)}
              options={EQUIPMENT_CATEGORIES.map((c) => ({
                value: c.value,
                label: c.label,
              }))}
              style={{ width: "100%", minWidth: 240 }}
              maxTagCount="responsive"
            />
          </Space>
        </SearchForm>
      </PageHeader>

      <PageContent>
        {error ? (
          <FetchError
            error={error}
            fallback="Không tải được lịch phòng"
            onRetry={() => void refetch()}
            loading={isLoading}
          />
        ) : searchMiss ? (
          <NoSearchResult onReset={() => setSearch("")} />
        ) : (
          <RoomDayTimeline
            date={dateStr}
            rooms={filteredRooms}
            bookings={filteredBookings}
            loading={isLoading}
            onEmptySlotClick={(slot) => openBookingModal(slot)}
            onRoomView3d={setRoom3d}
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
        <ErrorMessage message={bookingError} style={{ marginBottom: 16 }} />

        <Form form={form} layout="vertical" onFinish={handleBooking}>
          <Form.Item
            label="Phòng"
            name="roomId"
            rules={[{ required: true, message: "Vui lòng chọn phòng" }]}
          >
            <Select
              placeholder="Chọn phòng"
              options={roomSelectOptions}
              showSearch
              optionFilterProp="label"
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
                  const startTime: Dayjs | undefined =
                    getFieldValue("startTime");
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

          {estimatedFee != null ? (
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Ước tính phí: <strong>{formatVnd(estimatedFee)}</strong> (làm
              tròn lên theo khối 30 phút, tối thiểu 1 khối)
              {user?.role !== "ADMIN" ? " — tính sau khi admin duyệt" : null}
            </Typography.Paragraph>
          ) : null}
        </Form>
      </CreateDialog>
    </PageLayout>
    <Room3DDialog
      open={room3d != null}
      room={room3d}
      onClose={() => setRoom3d(null)}
    />
    </>
  );
}
