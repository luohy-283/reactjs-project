import { useMemo, useState } from "react";
import { Card, Modal, Tooltip, Typography, theme } from "antd";
import dayjs from "dayjs";
import type { Booking } from "@/lib/types/booking";
import type { Room } from "@/features/rooms/api/rooms.types";
import { HEADER_HEIGHT } from "@/components/layouts/Topbar";
import { formatVnd } from "@/lib/money";
import { NoData } from "@/components/ui/empty/NoData";

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 22;
const TOTAL_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;
const HOUR_WIDTH = 72;
const ROW_HEIGHT = 56;
const LABEL_WIDTH = 160;
/** Topbar + page chrome (margins, header, filters, legend) above/below the grid. */
const VIEWPORT_CHROME = 260;

export type TimelineSlotClick = {
  roomId: number;
  startHour: number;
  startMinute: number;
};

type RoomDayTimelineProps = {
  date: string;
  rooms: Room[];
  bookings: Booking[];
  loading?: boolean;
  onEmptySlotClick?: (slot: TimelineSlotClick) => void;
};

function minutesFromDayStart(iso: string, date: string): number {
  const t = dayjs(iso);
  const dayStart = dayjs(`${date}T${String(DAY_START_HOUR).padStart(2, "0")}:00:00`);
  return Math.max(0, Math.min(TOTAL_MINUTES, t.diff(dayStart, "minute")));
}

function statusColor(status: Booking["status"]): string {
  if (status === "PENDING") return "#faad14";
  if (status === "APPROVED") return "#1677ff";
  if (status === "EXPIRED") return "#fa541c";
  return "#d9d9d9";
}

export function RoomDayTimeline({
  date,
  rooms,
  bookings,
  loading,
  onEmptySlotClick,
}: RoomDayTimelineProps) {
  const { token } = theme.useToken();
  const [detail, setDetail] = useState<Booking | null>(null);
  const hours = useMemo(
    () => Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i),
    [],
  );

  const activeRooms = useMemo(
    () => rooms.filter((r) => r.isActive),
    [rooms],
  );

  const trackWidth = hours.length * HOUR_WIDTH;
  const contentWidth = LABEL_WIDTH + trackWidth;

  if (!loading && activeRooms.length === 0) {
    return <NoData description="Không có phòng họp" />;
  }

  const labelBase = {
    width: LABEL_WIDTH,
    flexShrink: 0 as const,
    background: token.colorBgContainer,
    boxShadow: `1px 0 0 ${token.colorBorderSecondary}`,
  };

  return (
    <>
      <Card loading={loading} styles={{ body: { padding: 12 } }}>
        <div
          style={{
            maxHeight: `calc(100dvh - ${HEADER_HEIGHT}px - ${VIEWPORT_CHROME}px)`,
            overflow: "auto",
            position: "relative",
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadiusLG,
          }}
        >
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 3,
              display: "flex",
              width: contentWidth,
              minWidth: contentWidth,
              background: token.colorBgContainer,
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <div
              style={{
                ...labelBase,
                position: "sticky",
                left: 0,
                top: 0,
                zIndex: 4,
                padding: "8px 8px 8px 12px",
                fontSize: 12,
                fontWeight: 600,
                color: token.colorTextSecondary,
                display: "flex",
                alignItems: "center",
              }}
            >
              Phòng
            </div>
            <div style={{ display: "flex", width: trackWidth }}>
              {hours.map((h) => (
                <div
                  key={h}
                  style={{
                    width: HOUR_WIDTH,
                    flexShrink: 0,
                    fontSize: 12,
                    color: token.colorTextSecondary,
                    borderLeft: `1px solid ${token.colorBorderSecondary}`,
                    padding: "8px 0 8px 4px",
                  }}
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>
          </div>

          {activeRooms.map((room) => {
            const roomBookings = bookings.filter((b) => b.roomId === room.id);
            return (
              <div
                key={room.id}
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  width: contentWidth,
                  minWidth: contentWidth,
                  borderTop: `1px solid ${token.colorBorderSecondary}`,
                  height: ROW_HEIGHT,
                }}
              >
                <div
                  style={{
                    ...labelBase,
                    position: "sticky",
                    left: 0,
                    zIndex: 2,
                    padding: "8px 8px 8px 12px",
                    fontSize: 13,
                    fontWeight: 500,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <span>{room.name}</span>
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {room.capacity} người
                  </Typography.Text>
                </div>
                <div
                  style={{
                    position: "relative",
                    width: trackWidth,
                    flexShrink: 0,
                    background: `repeating-linear-gradient(to right, ${token.colorFillQuaternary} 0, ${token.colorFillQuaternary} 1px, transparent 1px, transparent ${HOUR_WIDTH}px)`,
                    cursor: onEmptySlotClick ? "cell" : "default",
                  }}
                  onClick={(e) => {
                    if (!onEmptySlotClick) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const minutes = Math.floor((x / trackWidth) * TOTAL_MINUTES);
                    const snapped = Math.floor(minutes / 30) * 30;
                    const hour = DAY_START_HOUR + Math.floor(snapped / 60);
                    const minute = snapped % 60;
                    if (hour >= DAY_END_HOUR) return;
                    onEmptySlotClick({
                      roomId: room.id,
                      startHour: hour,
                      startMinute: minute,
                    });
                  }}
                >
                  {roomBookings.map((b) => {
                    const startMin = minutesFromDayStart(b.startTime, date);
                    const endMin = minutesFromDayStart(b.endTime, date);
                    if (endMin <= 0 || startMin >= TOTAL_MINUTES) return null;
                    const left = (startMin / TOTAL_MINUTES) * trackWidth;
                    const width = Math.max(
                      8,
                      ((endMin - startMin) / TOTAL_MINUTES) * trackWidth,
                    );
                    return (
                      <Tooltip
                        key={b.id}
                        title={
                          <div>
                            <div>{b.title}</div>
                            <div>
                              {dayjs(b.startTime).format("HH:mm")} –{" "}
                              {dayjs(b.endTime).format("HH:mm")}
                            </div>
                            {b.userLogin ? <div>{b.userLogin}</div> : null}
                            {b.amount != null ? (
                              <div>{formatVnd(b.amount)}</div>
                            ) : null}
                            <div>{b.status}</div>
                          </div>
                        }
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetail(b);
                          }}
                          style={{
                            position: "absolute",
                            top: 8,
                            left,
                            width,
                            height: ROW_HEIGHT - 16,
                            border: "none",
                            borderRadius: 4,
                            background: statusColor(b.status),
                            color: "#fff",
                            fontSize: 11,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            padding: "0 6px",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          {b.title}
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: "block" }}>
          Click ô trống để đặt phòng · Vàng = chờ duyệt · Xanh = đã duyệt · Đỏ cam = hết hạn · Xám = đã hủy ·
          Khung giờ {String(DAY_START_HOUR).padStart(2, "0")}:00–
          {String(DAY_END_HOUR).padStart(2, "0")}:00
        </Typography.Text>
      </Card>

      <Modal
        title="Chi tiết lịch"
        open={Boolean(detail)}
        onCancel={() => setDetail(null)}
        onOk={() => setDetail(null)}
        okText="Đóng"
        cancelButtonProps={{ style: { display: "none" } }}
      >
        {detail ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div>
              <strong>Tiêu đề:</strong> {detail.title}
            </div>
            <div>
              <strong>Phòng:</strong> {detail.roomName ?? "—"}
            </div>
            <div>
              <strong>Thời gian:</strong>{" "}
              {dayjs(detail.startTime).format("DD/MM/YYYY HH:mm")} –{" "}
              {dayjs(detail.endTime).format("HH:mm")}
            </div>
            <div>
              <strong>Người đặt:</strong> {detail.userLogin ?? "—"}
            </div>
            <div>
              <strong>Trạng thái:</strong> {detail.status}
            </div>
            {detail.amount != null ? (
              <div>
                <strong>Phí:</strong> {formatVnd(detail.amount)}
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
