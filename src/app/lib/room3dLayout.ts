export type EquipmentCategory =
  | "PROJECTOR"
  | "DISPLAY"
  | "AUDIO"
  | "VC"
  | "MICROPHONE"
  | "OTHER";

export type RoomEquipmentStatus = "OK" | "BROKEN" | "RETIRED";

export interface LayoutEquipmentInput {
  equipmentName: string;
  category: EquipmentCategory;
  quantity: number;
  status: RoomEquipmentStatus;
}

export interface Room3DLayoutInput {
  capacity: number;
  isVip?: boolean;
  floorWidthM?: number;
  floorDepthM?: number;
  equipment: LayoutEquipmentInput[];
}

export type MeshKind =
  | "table"
  | "chair"
  | "projector"
  | "display"
  | "audio"
  | "vc"
  | "other";

export interface PlacedItem {
  id: string;
  kind: MeshKind;
  label: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  /** Table length (X) / depth (Z) — used by table mesh. */
  scale?: [number, number];
  status: RoomEquipmentStatus;
}

export interface Room3DLayout {
  floorSize: [number, number];
  wallHeight: number;
  isVip: boolean;
  items: PlacedItem[];
}

const MAX_INSTANCES_PER_TYPE = 8;
/** Clearance from table edge to chair center (meters). */
const CHAIR_OFFSET = 0.55;

function clampInstances(count: number): number {
  return Math.min(Math.max(1, count), MAX_INSTANCES_PER_TYPE);
}

/**
 * Place chairs along the long sides of a rectangular table (meeting-room layout).
 * Origins sit on the floor (y = 0). Chairs face the table.
 */
function chairsAlongTable(
  count: number,
  centerX: number,
  centerZ: number,
  tableLen: number,
  tableDepth: number,
): Array<{ pos: [number, number, number]; rotY: number }> {
  if (count <= 0) return [];

  const sideCount = Math.ceil(count / 2);
  const otherCount = count - sideCount;
  const zNorth = centerZ - tableDepth / 2 - CHAIR_OFFSET;
  const zSouth = centerZ + tableDepth / 2 + CHAIR_OFFSET;
  const result: Array<{ pos: [number, number, number]; rotY: number }> = [];

  const placeSide = (n: number, z: number, rotY: number) => {
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const x = centerX + (t - 0.5) * Math.max(tableLen - 0.4, 0.8);
      result.push({ pos: [x, 0, z], rotY });
    }
  };

  placeSide(sideCount, zNorth, 0);
  placeSide(otherCount, zSouth, Math.PI);

  return result;
}

type WallSlot = { x: number; y: number; z: number; rotY?: number };

function wallSlotsForCategory(
  category: EquipmentCategory,
  floorW: number,
  floorD: number,
  wallH: number,
  index: number,
  total: number,
): WallSlot {
  const halfW = floorW / 2 - 0.35;
  const halfD = floorD / 2 - 0.35;
  const spread =
    total > 1 ? (index / (total - 1) - 0.5) * Math.min(floorW - 1.4, 4) : 0;

  switch (category) {
    case "PROJECTOR":
      // Ceiling mount near back wall
      return { x: spread * 0.4, y: wallH - 0.25, z: -halfD + 0.8, rotY: 0 };
    case "DISPLAY":
      // Flat on back wall, centered / spaced
      return {
        x: spread,
        y: 1.35,
        z: -halfD + 0.08,
        rotY: 0,
      };
    case "AUDIO":
      // Floor-standing corners
      return {
        x: index % 2 === 0 ? -halfW + 0.2 : halfW - 0.2,
        y: 0,
        z: index < 2 ? -halfD + 0.35 : halfD - 0.35,
        rotY: index % 2 === 0 ? Math.PI / 2 : -Math.PI / 2,
      };
    case "VC":
      // Front wall, camera bar height
      return { x: spread, y: 1.55, z: halfD - 0.08, rotY: Math.PI };
    default:
      // Side shelves / stands
      return {
        x: index % 2 === 0 ? -halfW + 0.15 : halfW - 0.15,
        y: 0,
        z: -halfD + 0.9 + Math.floor(index / 2) * 0.7,
        rotY: index % 2 === 0 ? Math.PI / 2 : -Math.PI / 2,
      };
  }
}

function categoryToKind(category: EquipmentCategory): MeshKind {
  switch (category) {
    case "PROJECTOR":
      return "projector";
    case "DISPLAY":
      return "display";
    case "AUDIO":
      return "audio";
    case "VC":
      return "vc";
    default:
      return "other";
  }
}

/** Procedural room layout from capacity + floor size + equipment list. */
export function buildRoom3DLayout(input: Room3DLayoutInput): Room3DLayout {
  const capacity = Math.max(1, input.capacity);
  const isVip = Boolean(input.isVip);
  const floorW = Math.max(
    3,
    Math.min(20, input.floorWidthM ?? Math.max(6, Math.ceil(Math.sqrt(capacity)) * 1.8)),
  );
  const floorD = Math.max(
    2.5,
    Math.min(16, input.floorDepthM ?? floorW * 0.75),
  );
  const floorSize: [number, number] = [floorW, floorD];
  const wallHeight = isVip ? 3.2 : 2.8;
  const items: PlacedItem[] = [];

  const tableCount = capacity > 12 ? 2 : 1;
  const chairsPerTable = Math.ceil(capacity / tableCount);
  const tableOffsets =
    tableCount === 1
      ? [{ x: 0, z: 0 }]
      : [
          { x: 0, z: -floorSize[1] * 0.18 },
          { x: 0, z: floorSize[1] * 0.18 },
        ];

  tableOffsets.forEach((offset, ti) => {
    const seats = Math.min(chairsPerTable, capacity - ti * chairsPerTable);
    const tableLen = Math.min(
      floorSize[0] * 0.55,
      Math.max(2.2, seats * 0.45),
    );
    const tableDepth = seats > 8 ? 1.35 : 1.15;

    items.push({
      id: `table-${ti}`,
      kind: "table",
      label: "Bàn họp",
      position: [offset.x, 0, offset.z],
      scale: [tableLen, tableDepth],
      status: "OK",
    });

    chairsAlongTable(seats, offset.x, offset.z, tableLen, tableDepth).forEach(
      (chair, ci) => {
        items.push({
          id: `chair-${ti}-${ci}`,
          kind: "chair",
          label: "Ghế",
          position: chair.pos,
          rotation: [0, chair.rotY, 0],
          status: "OK",
        });
      },
    );
  });

  const expanded: LayoutEquipmentInput[] = [];
  for (const eq of input.equipment) {
    if (eq.status === "RETIRED") continue;
    const n = clampInstances(eq.quantity);
    for (let i = 0; i < n; i++) {
      expanded.push({ ...eq, quantity: 1 });
    }
  }

  const byCategory = new Map<EquipmentCategory, LayoutEquipmentInput[]>();
  for (const eq of expanded) {
    const list = byCategory.get(eq.category) ?? [];
    list.push(eq);
    byCategory.set(eq.category, list);
  }

  for (const [category, list] of byCategory) {
    list.forEach((eq, index) => {
      const slot = wallSlotsForCategory(
        category,
        floorSize[0],
        floorSize[1],
        wallHeight,
        index,
        list.length,
      );
      items.push({
        id: `eq-${category}-${index}-${eq.equipmentName}`,
        kind: categoryToKind(category),
        label: eq.equipmentName,
        position: [slot.x, slot.y, slot.z],
        rotation: slot.rotY != null ? [0, slot.rotY, 0] : undefined,
        status: eq.status,
      });
    });
  }

  return { floorSize, wallHeight, isVip, items };
}
