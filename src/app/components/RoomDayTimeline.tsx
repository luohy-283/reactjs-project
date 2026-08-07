import { useMemo, useState } from "react";
import { Card } from "primereact/card";
import { Tooltip } from "primereact/tooltip";
import dayjs from "dayjs";
import type { Booking } from "@/lib/types/booking";
import type { Room } from "@/features/rooms/api/rooms.types";
import { HEADER_HEIGHT } from "@/components/layouts/Topbar";
import { formatVnd } from "@/lib/money";
import { NoData } from "@/components/ui/empty/NoData";
import { ViewDialog } from "@/components/ui/dialog/ViewDialog";
import { useIsDarkMode } from "@/lib/useIsDarkMode";

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

function timelineColors(isDark: boolean) {
  return {
    bg: isDark ? "#1f1f1f" : "#ffffff",
    border: isDark ? "#424242" : "#f0f0f0",
    textSecondary: isDark ? "#a6a6a6" : "#8c8c8c",
    fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
  };
}

export function RoomDayTimeline({
  date,
  rooms,
  bookings,
  loading,
  onEmptySlotClick,
}: RoomDayTimelineProps) {
  const isDark = useIsDarkMode();
  const token = timelineColors(isDark);
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
    background: token.bg,
    boxShadow: `1px 0 0 ${token.border}`,
  };

  return (
    <>
      <Tooltip target=".timeline-booking-block" position="top" />
      <Card
        pt={{
          body: { style: { padding: 12 } },
          content: { style: { padding: 0 } },
        }}
      >
        {loading ? (
          <div style={{ height: 200 }} />
        ) : (
          <>
            <div
              style={{
                maxHeight: `calc(100dvh - ${HEADER_HEIGHT}px - ${VIEWPORT_CHROME}px)`,
                overflow: "auto",
                position: "relative",
                border: `1px solid ${token.border}`,
                borderRadius: 8,
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
                  background: token.bg,
                  borderBottom: `1px solid ${token.border}`,
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
                    color: token.textSecondary,
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
                        color: token.textSecondary,
                        borderLeft: `1px solid ${token.border}`,
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
                      borderTop: `1px solid ${token.border}`,
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
                      <span style={{ fontSize: 11, color: token.textSecondary }}>
                        {room.capacity} người
                      </span>
                    </div>
                    <div
                      style={{
                        position: "relative",
                        width: trackWidth,
                        flexShrink: 0,
                        background: `repeating-linear-gradient(to right, ${token.fill} 0, ${token.fill} 1px, transparent 1px, transparent ${HOUR_WIDTH}px)`,
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
                        const tip = [
                          b.title,
                          `${dayjs(b.startTime).format("HH:mm")} – ${dayjs(b.endTime).format("HH:mm")}`,
                          b.userLogin,
                          b.amount != null ? formatVnd(b.amount) : null,
                          b.status,
                        ]
                          .filter(Boolean)
                          .join("\n");
                        return (
                          <button
                            key={b.id}
                            type="button"
                            className="timeline-booking-block"
                            data-pr-tooltip={tip}
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
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              style={{
                fontSize: 12,
                marginTop: 8,
                color: token.textSecondary,
              }}
            >
              Click ô trống để đặt phòng · Vàng = chờ duyệt · Xanh = đã duyệt · Đỏ
              cam = hết hạn · Xám = đã hủy · Khung giờ{" "}
              {String(DAY_START_HOUR).padStart(2, "0")}:00–
              {String(DAY_END_HOUR).padStart(2, "0")}:00
            </div>
          </>
        )}
      </Card>

      <ViewDialog
        title="Chi tiết lịch"
        open={Boolean(detail)}
        onCancel={() => setDetail(null)}
        onOk={() => setDetail(null)}
        okText="Đóng"
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
      </ViewDialog>
    </>
  );
}
