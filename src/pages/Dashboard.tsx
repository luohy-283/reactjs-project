import { useState } from "react";
import {
  Card,
  DatePicker,
  Table,
  Button,
  Modal,
  Form,
  Select,
  TimePicker,
  Input,
  Alert,
  message,
  Row,
  Col,
  Space,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import { createBooking } from "../api/bookings/bookings.service";
import { useRoomSchedule } from "../api/bookings/bookings.hooks";
import { useAuth } from "../context/AuthContext";

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

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const dateStr = selectedDate.format("YYYY-MM-DD");
  const { rooms, bookings, isLoading, refetch } = useRoomSchedule(dateStr);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [form] = Form.useForm<{
    roomId: number;
    startTime: Dayjs;
    endTime: Dayjs;
    title: string;
  }>();

  const scheduleRows: RoomScheduleRow[] = rooms.map((room) => ({
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
  }));

  const columns: ColumnsType<RoomScheduleRow> = [
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
  ];

  const combineDateTime = (time: Dayjs): Dayjs =>
    selectedDate
      .hour(time.hour())
      .minute(time.minute())
      .second(0)
      .millisecond(0);

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
      message.success(
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

  return (
    <Card title="Lịch phòng họp">
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <span>Chọn ngày</span>
            <DatePicker
              value={selectedDate}
              onChange={(date) => date && setSelectedDate(date)}
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
            />
          </Space>
        </Col>
        <Col xs={24} sm={12} md={16} style={{ textAlign: "right" }}>
          <Button type="primary" onClick={openBookingModal}>
            Đặt phòng
          </Button>
        </Col>
      </Row>

      <Table
        className="room-schedule-table"
        rowKey="key"
        columns={columns}
        dataSource={scheduleRows}
        loading={isLoading}
        pagination={false}
        scroll={{ x: TABLE_SCROLL_X }}
      />

      <Modal
        title="Đặt phòng họp"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="Đặt phòng"
        cancelText="Hủy"
        destroyOnHidden
      >
        {bookingError && (
          <Alert
            type="error"
            message={bookingError}
            style={{ marginBottom: 16 }}
            showIcon
          />
        )}

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
            <TimePicker format="HH:mm" style={{ width: "100%" }} />
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
            <TimePicker format="HH:mm" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Tiêu đề cuộc họp"
            name="title"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input placeholder="VD: Họp planning tuần" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
