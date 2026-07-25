import { useMemo, useState } from "react";
import {
  Card,
  Table,
  Tabs,
  Tag,
  Button,
  Space,
  Popconfirm,
  message,
  Badge,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  approveBooking,
  rejectBooking,
} from "../api/bookings/bookings.service";
import { useBookings } from "../api/bookings/bookings.hooks";
import type { Booking, BookingStatus } from "../api/bookings/bookings.types";

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  CANCELLED: "Từ chối",
};

const STATUS_COLOR: Record<BookingStatus, string> = {
  PENDING: "gold",
  APPROVED: "green",
  CANCELLED: "default",
};

function formatRange(startTime: string, endTime: string): string {
  return `${dayjs(startTime).format("DD/MM/YYYY HH:mm")} – ${dayjs(endTime).format("HH:mm")}`;
}

export default function AdminBookings() {
  const { data: bookings, isLoading, refetch } = useBookings();
  const [actingId, setActingId] = useState<number | null>(null);

  const pending = useMemo(
    () =>
      bookings
        .filter((b) => b.status === "PENDING")
        .sort(
          (a, b) =>
            dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf(),
        ),
    [bookings],
  );

  const history = useMemo(
    () =>
      [...bookings].sort(
        (a, b) => dayjs(b.startTime).valueOf() - dayjs(a.startTime).valueOf(),
      ),
    [bookings],
  );

  const handleApprove = async (booking: Booking) => {
    setActingId(booking.id);
    try {
      await approveBooking(booking.id);
      message.success("Đã duyệt yêu cầu đặt phòng");
      await refetch();
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (booking: Booking) => {
    setActingId(booking.id);
    try {
      await rejectBooking(booking.id);
      message.success("Đã từ chối yêu cầu đặt phòng");
      await refetch();
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setActingId(null);
    }
  };

  const baseColumns: ColumnsType<Booking> = [
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
        <Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Tag>
      ),
    },
  ];

  const pendingColumns: ColumnsType<Booking> = [
    ...baseColumns.filter((col) => col.key !== "status"),
    {
      title: "Thao tác",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, booking) => (
        <Space>
          <Popconfirm
            title="Duyệt yêu cầu này?"
            description="Lịch sẽ chuyển sang Đã duyệt."
            onConfirm={() => handleApprove(booking)}
            okText="Duyệt"
            cancelText="Hủy"
          >
            <Button
              type="primary"
              size="small"
              loading={actingId === booking.id}
            >
              Duyệt
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Từ chối yêu cầu này?"
            description="Lịch sẽ bị hủy (CANCELLED)."
            onConfirm={() => handleReject(booking)}
            okText="Từ chối"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger size="small" loading={actingId === booking.id}>
              Từ chối
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="Quản lý đặt phòng">
      <Tabs
        items={[
          {
            key: "pending",
            label: (
              <Badge count={pending.length} offset={[10, 0]} size="small">
                Chờ duyệt
              </Badge>
            ),
            children: (
              <Table
                rowKey="id"
                columns={pendingColumns}
                dataSource={pending}
                loading={isLoading}
                locale={{ emptyText: "Không có yêu cầu chờ duyệt" }}
                scroll={{ x: 900 }}
                pagination={{ pageSize: 10 }}
              />
            ),
          },
          {
            key: "all",
            label: "Lịch sử",
            children: (
              <Table
                rowKey="id"
                columns={baseColumns}
                dataSource={history}
                loading={isLoading}
                locale={{ emptyText: "Chưa có lịch đặt nào" }}
                scroll={{ x: 900 }}
                pagination={{ pageSize: 10 }}
              />
            ),
          },
        ]}
      />
    </Card>
  );
}
