import { useMemo, useState } from "react";
import { Card, Modal, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import type { Booking } from "@/features/bookings/api/bookings.types";
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
  if (status === "EXPIRED") return "#fa8c16";
  return "#d9d9d9";
}

export function RoomDayTimeline({
  date,
  rooms,
  bookings,
  loading,
  onEmptySlotClick,
}: RoomDayTimelineProps) {
  const [detail, setDetail] = useState<Booking | null>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
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

  return (
    <>
      <Card loading={loading} styles={{ body: { padding: 12 } }}>
        {/* Wrapper bounds sticky: pin only while grid is in view, not the legend. */}
        <div>
          <div
            style={{
              position: "sticky",
              top: HEADER_HEIGHT,
              zIndex: 3,
              background: "#fff",
              overflow: "hidden",
              marginBottom: 4,
              paddingBottom: 4,
            }}
          >
            <div
              style={{
                display: "flex",
                width: contentWidth,
                transform: `translateX(-${scrollLeft}px)`,
              }}
            >
              <div style={{ width: LABEL_WIDTH, flexShrink: 0 }} />
              <div style={{ display: "flex", width: trackWidth }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    style={{
                      width: HOUR_WIDTH,
                      fontSize: 12,
                      color: "rgba(0,0,0,0.45)",
                      borderLeft: "1px solid #f0f0f0",
                      paddingLeft: 4,
                    }}
                  >
                    {String(h).padStart(2, "0")}:00
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{ overflowX: "auto" }}
            onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
          >
            <div style={{ minWidth: contentWidth }}>
              {activeRooms.map((room) => {
                const roomBookings = bookings.filter((b) => b.roomId === room.id);
                return (
                  <div
                    key={room.id}
                    style={{
                      display: "flex",
                      alignItems: "stretch",
                      borderTop: "1px solid #f0f0f0",
                      height: ROW_HEIGHT,
                    }}
                  >
                    <div
                      style={{
                        width: LABEL_WIDTH,
                        flexShrink: 0,
                        padding: "8px 8px 8px 0",
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
                        background:
                          "repeating-linear-gradient(to right, #fafafa 0, #fafafa 1px, transparent 1px, transparent " +
                          HOUR_WIDTH +
                          "px)",
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
          </div>
        </div>
        <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: "block" }}>
          Click ô trống để đặt phòng · Vàng = chờ duyệt · Xanh = đã duyệt · Cam = hết hạn · Xám = đã hủy ·
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
