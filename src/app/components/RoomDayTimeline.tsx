import { useMemo, useState } from "react";
import { Button, Card, Modal, Space, Tag, Tooltip, Typography, theme } from "antd";
import dayjs from "dayjs";
import type { Booking } from "@/lib/types/booking";
import type { Room } from "@/features/rooms/api/rooms.types";
import { HEADER_HEIGHT } from "@/components/layouts/Topbar";
import { formatVnd } from "@/lib/money";
import { NoData } from "@/components/ui/empty/NoData";
import {
  computeDensityLabel,
  equipmentCategoryLabel,
  formatFloorSize,
  layoutTypeLabel,
} from "@/lib/room-layout";

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 22;
const TOTAL_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;
const HOUR_WIDTH = 72;
const ROW_MIN_HEIGHT = 64;
const LABEL_WIDTH = 220;
const MAX_VISIBLE_EQUIPMENT_TAGS = 2;
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
  onRoomView3d?: (room: Room) => void;
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
  onRoomView3d,
}: RoomDayTimelineProps) {
  const { token } = theme.useToken();
  const [detail, setDetail] = useState<Booking | null>(null);
  const hours = useMemo(
    () => Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i),
    [],
  );

  const trackWidth = hours.length * HOUR_WIDTH;
  const contentWidth = LABEL_WIDTH + trackWidth;

  if (!loading && rooms.length === 0) {
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
            scrollbarGutter: "stable",
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

          {rooms.map((room) => {
            const roomBookings = bookings.filter((b) => b.roomId === room.id);
            const density = computeDensityLabel(
              room.floorWidthM,
              room.floorDepthM,
              room.capacity,
            );
            const floor = formatFloorSize(room.floorWidthM, room.floorDepthM);
            const categories = room.equipmentCategories ?? [];
            const equipmentLabels =
              (room.equipmentNames?.length ?? 0) > 0
                ? (room.equipmentNames ?? [])
                : categories.map(equipmentCategoryLabel);
            const tooltipTitle = (
              <div>
                <div>{room.name}</div>
                <div>
                  {room.capacity} chỗ · {layoutTypeLabel(room.layoutType)} ·{" "}
                  {density}
                  {floor ? ` · ${floor}` : ""}
                </div>
                <div>
                  {equipmentLabels.length > 0
                    ? equipmentLabels.join(", ")
                    : "Không có thiết bị"}
                </div>
                <div>{formatVnd(room.pricePerHour)}/giờ</div>
              </div>
            );
            const visibleEquipment = equipmentLabels.slice(
              0,
              MAX_VISIBLE_EQUIPMENT_TAGS,
            );
            const hiddenEquipmentCount =
              equipmentLabels.length - visibleEquipment.length;
            return (
              <div
                key={room.id}
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  width: contentWidth,
                  minWidth: contentWidth,
                  borderTop: `1px solid ${token.colorBorderSecondary}`,
                  minHeight: ROW_MIN_HEIGHT,
                }}
              >
                <div
                  style={{
                    ...labelBase,
                    position: "sticky",
                    left: 0,
                    zIndex: 2,
                    padding: "6px 8px 6px 12px",
                    fontSize: 13,
                    fontWeight: 500,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 2,
                    overflow: "hidden",
                  }}
                >
                  <Tooltip title={tooltipTitle}>
                    <Space size={4} wrap={false} style={{ maxWidth: "100%" }}>
                      {onRoomView3d ? (
                        <Button
                          type="link"
                          size="small"
                          style={{
                            padding: 0,
                            height: "auto",
                            fontSize: 13,
                            fontWeight: 500,
                          }}
                          onClick={() => onRoomView3d(room)}
                        >
                          {room.name}
                        </Button>
                      ) : (
                        <span>{room.name}</span>
                      )}
                      {room.isVip ? (
                        <Tag
                          color="gold"
                          style={{
                            marginInlineEnd: 0,
                            fontSize: 10,
                            lineHeight: "16px",
                            paddingInline: 4,
                          }}
                        >
                          VIP
                        </Tag>
                      ) : null}
                    </Space>
                  </Tooltip>
                  <Typography.Text
                    type="secondary"
                    style={{
                      fontSize: 11,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {room.capacity} chỗ · {layoutTypeLabel(room.layoutType)} ·{" "}
                    {density}
                    {floor ? ` · ${floor}` : ""}
                  </Typography.Text>
                  <Space size={2} wrap={false} style={{ maxWidth: "100%" }}>
                    {equipmentLabels.length === 0 ? (
                      <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                        Không có thiết bị
                      </Typography.Text>
                    ) : (
                      <>
                        {visibleEquipment.map((label) => (
                          <Tag
                            key={label}
                            style={{
                              marginInlineEnd: 0,
                              fontSize: 10,
                              lineHeight: "16px",
                              paddingInline: 4,
                            }}
                          >
                            {label}
                          </Tag>
                        ))}
                        {hiddenEquipmentCount > 0 ? (
                          <Tooltip
                            title={equipmentLabels
                              .slice(MAX_VISIBLE_EQUIPMENT_TAGS)
                              .join(", ")}
                          >
                            <Tag
                              style={{
                                marginInlineEnd: 0,
                                fontSize: 10,
                                lineHeight: "16px",
                                paddingInline: 4,
                              }}
                            >
                              +{hiddenEquipmentCount}
                            </Tag>
                          </Tooltip>
                        ) : null}
                      </>
                    )}
                  </Space>
                </div>
                <div
                  style={{
                    position: "relative",
                    width: trackWidth,
                    flexShrink: 0,
                    minHeight: ROW_MIN_HEIGHT,
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
                            bottom: 8,
                            left,
                            width,
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
          {/* Reserve space so horizontal scrollbar does not cover the last room row. */}
          <div style={{ height: 14, width: contentWidth, minWidth: contentWidth }} aria-hidden />
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
