export type RoomLayoutType =
  | "COMPACT"
  | "STANDARD"
  | "SPACIOUS"
  | "BOARDROOM"
  | "AUDITORIUM";

export type DensityLabel = "Thoáng" | "Vừa" | "Chật";

const LAYOUT_LABEL: Record<RoomLayoutType, string> = {
  COMPACT: "Gọn",
  STANDARD: "Tiêu chuẩn",
  SPACIOUS: "Không gian lớn",
  BOARDROOM: "Boardroom",
  AUDITORIUM: "Hội trường",
};

const EQUIPMENT_LABEL: Record<string, string> = {
  PROJECTOR: "Máy chiếu",
  DISPLAY: "Màn hình",
  AUDIO: "Âm thanh",
  VC: "Họp trực tuyến",
  MICROPHONE: "Micro không dây",
  OTHER: "Khác",
};

export function layoutTypeLabel(layoutType?: RoomLayoutType | null): string {
  if (!layoutType) return "Tiêu chuẩn";
  return LAYOUT_LABEL[layoutType] ?? layoutType;
}

/** m² per seat → density wording (independent of layoutType enum). */
export function computeDensityLabel(
  floorWidthM: number | undefined,
  floorDepthM: number | undefined,
  capacity: number,
): DensityLabel {
  const w = floorWidthM ?? 0;
  const d = floorDepthM ?? 0;
  const seats = Math.max(1, capacity);
  const area = w * d;
  if (area <= 0) return "Vừa";
  const m2PerSeat = area / seats;
  if (m2PerSeat >= 5) return "Thoáng";
  if (m2PerSeat >= 2.5) return "Vừa";
  return "Chật";
}

export function formatFloorSize(
  floorWidthM?: number,
  floorDepthM?: number,
): string | null {
  if (floorWidthM == null || floorDepthM == null) return null;
  const w = Number(floorWidthM);
  const d = Number(floorDepthM);
  if (!Number.isFinite(w) || !Number.isFinite(d)) return null;
  return `${w}×${d}m`;
}

export function equipmentCategoryLabel(category: string): string {
  return EQUIPMENT_LABEL[category] ?? category;
}

/** Prefer catalog names; fall back to category labels if names missing. */
export function formatRoomEquipment(
  names: string[] | undefined,
  categories: string[] | undefined,
): string {
  if (names && names.length > 0) return names.join(", ");
  return formatEquipmentCategories(categories);
}

export function formatEquipmentCategories(
  categories: string[] | undefined,
): string {
  if (!categories || categories.length === 0) return "Không có thiết bị";
  return categories.map(equipmentCategoryLabel).join(", ");
}
