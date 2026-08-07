import { useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
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

import { createBooking } from "@/features/bookings/api/bookings.service";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useRoomSchedule } from "@/app/hooks/use-room-schedule";
import { estimateBookingAmount, formatVnd } from "@/lib/money";

type BookingFormValues = {
  roomId: number | null;
  startTime: Date | null;
  endTime: Date | null;
  title: string;
};

const EMPTY_FORM: BookingFormValues = {
  roomId: null,
  startTime: null,
  endTime: null,
  title: "",
};

const fieldErrorStyle = { color: "var(--p-red-500, #ef4444)", display: "block" as const };

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
  const [values, setValues] = useState<BookingFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const combineDateTime = (time: Date): Dayjs =>
    selectedDate
      .hour(time.getHours())
      .minute(time.getMinutes())
      .second(0)
      .millisecond(0);

  const estimatedFee = useMemo(() => {
    const room = rooms.find((r) => r.id === values.roomId);
    if (!room || !values.startTime || !values.endTime) return null;
    const startIso = combineDateTime(values.startTime).toISOString();
    const endIso = combineDateTime(values.endTime).toISOString();
    if (!dayjs(endIso).isAfter(dayjs(startIso))) return null;
    return estimateBookingAmount(room.pricePerHour, startIso, endIso);
  }, [rooms, values.roomId, values.startTime, values.endTime, selectedDate]);

  const minSelectableDate = dayjs().startOf("day").toDate();
  const timeMinDate = selectedDate.isSame(dayjs(), "day")
    ? dayjs().toDate()
    : undefined;

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (values.roomId == null) next.roomId = "Vui lòng chọn phòng";
    if (!values.startTime) next.startTime = "Vui lòng chọn giờ bắt đầu";
    else if (combineDateTime(values.startTime).isBefore(dayjs())) {
      next.startTime = "Không thể chọn giờ trong quá khứ";
    }
    if (!values.endTime) next.endTime = "Vui lòng chọn giờ kết thúc";
    else if (values.startTime) {
      const startDateTime = combineDateTime(values.startTime);
      const endDateTime = combineDateTime(values.endTime);
      if (!endDateTime.isAfter(startDateTime)) {
        next.endTime = "Giờ kết thúc phải lớn hơn giờ bắt đầu";
      }
    }
    if (!values.title.trim()) next.title = "Vui lòng nhập tiêu đề";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const handleBooking = async () => {
    if (!user) return;
    if (!validate()) return;

    setSubmitting(true);
    setBookingError("");

    const startDateTime = combineDateTime(values.startTime as Date);
    const endDateTime = combineDateTime(values.endTime as Date);

    try {
      await createBooking({
        roomId: values.roomId as number,
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
      setValues({ ...EMPTY_FORM });
      setErrors({});
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
    setErrors({});
    if (prefill) {
      const start = dayjs()
        .hour(prefill.startHour)
        .minute(prefill.startMinute)
        .second(0)
        .toDate();
      const end = dayjs(start).add(1, "hour").toDate();
      setValues({
        roomId: prefill.roomId,
        startTime: start,
        endTime: end,
        title: "",
      });
    } else {
      setValues({ ...EMPTY_FORM });
    }
    setModalOpen(true);
  };

  const resetFilters = () => {
    setSelectedDate(dayjs());
    setSearch("");
  };

  const searchMiss =
    Boolean(search.trim()) &&
    !isLoading &&
    rooms.length > 0 &&
    filteredRooms.length === 0;

  const roomOptions = rooms.map((room) => ({
    value: room.id,
    label: `${room.name} (${room.capacity} người) — ${formatVnd(room.pricePerHour)}/giờ`,
  }));

  return (
    <PageLayout>
      <PageHeader
        title="Lịch phòng họp"
        extra={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <RefreshButton loading={isLoading} onClick={() => void refetch()} />
            <Button label="Đặt phòng" onClick={() => openBookingModal()} />
          </div>
        }
      >
        <SearchForm onReset={resetFilters}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span>Chọn ngày</span>
            <Calendar
              value={selectedDate.toDate()}
              onChange={(e) => {
                if (e.value instanceof Date) setSelectedDate(dayjs(e.value));
              }}
              dateFormat="dd/mm/yy"
              minDate={minSelectableDate}
              showIcon
              style={{ width: 180 }}
            />
          </div>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm theo phòng, lịch đặt…"
          />
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
          />
        )}
      </PageContent>

      <CreateDialog
        title="Đặt phòng họp"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => void handleBooking()}
        confirmLoading={submitting}
        okText="Đặt phòng"
      >
        <ErrorMessage message={bookingError} style={{ marginBottom: 16 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label htmlFor="booking-room" style={{ display: "block", marginBottom: 6 }}>
              Phòng
            </label>
            <Dropdown
              inputId="booking-room"
              value={values.roomId}
              onChange={(e) => setValues((v) => ({ ...v, roomId: e.value }))}
              options={roomOptions}
              optionLabel="label"
              optionValue="value"
              placeholder="Chọn phòng"
              style={{ width: "100%" }}
            />
            {errors.roomId ? <small style={fieldErrorStyle}>{errors.roomId}</small> : null}
          </div>

          <div>
            <label htmlFor="booking-start" style={{ display: "block", marginBottom: 6 }}>
              Giờ bắt đầu
            </label>
            <Calendar
              inputId="booking-start"
              value={values.startTime}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  startTime: e.value instanceof Date ? e.value : null,
                }))
              }
              timeOnly
              hourFormat="24"
              minDate={timeMinDate}
              style={{ width: "100%" }}
              inputStyle={{ width: "100%" }}
            />
            {errors.startTime ? (
              <small style={fieldErrorStyle}>{errors.startTime}</small>
            ) : null}
          </div>

          <div>
            <label htmlFor="booking-end" style={{ display: "block", marginBottom: 6 }}>
              Giờ kết thúc
            </label>
            <Calendar
              inputId="booking-end"
              value={values.endTime}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  endTime: e.value instanceof Date ? e.value : null,
                }))
              }
              timeOnly
              hourFormat="24"
              minDate={timeMinDate}
              style={{ width: "100%" }}
              inputStyle={{ width: "100%" }}
            />
            {errors.endTime ? (
              <small style={fieldErrorStyle}>{errors.endTime}</small>
            ) : null}
          </div>

          <div>
            <label htmlFor="booking-title" style={{ display: "block", marginBottom: 6 }}>
              Tiêu đề cuộc họp
            </label>
            <InputText
              id="booking-title"
              value={values.title}
              onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
              placeholder="VD: Họp planning tuần"
              style={{ width: "100%" }}
            />
            {errors.title ? <small style={fieldErrorStyle}>{errors.title}</small> : null}
          </div>

          {estimatedFee != null ? (
            <p
              style={{
                margin: 0,
                color: "var(--p-text-muted-color, #6b7280)",
                fontSize: 14,
              }}
            >
              Ước tính phí: <strong>{formatVnd(estimatedFee)}</strong> (làm
              tròn lên theo khối 30 phút, tối thiểu 1 khối)
              {user?.role !== "ADMIN" ? " — tính sau khi admin duyệt" : null}
            </p>
          ) : null}
        </div>
      </CreateDialog>
    </PageLayout>
  );
}
