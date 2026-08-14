import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Space, Tag, Typography } from "antd";
import { getRoomEquipment } from "@/features/equipment/api/equipment.service";
import type { RoomEquipment } from "@/features/equipment/api/equipment.types";
import {
  buildRoom3DLayout,
  type EquipmentCategory,
  type LayoutEquipmentInput,
} from "@/app/lib/room3dLayout";
import { Room3DScene } from "@/app/components/Room3DScene";
import { ErrorMessage } from "@/components/ui/error/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/loading/LoadingSpinner";
import { isAbortError } from "@/lib/api-error";

export type Room3DTarget = {
  id: number;
  name: string;
  capacity: number;
  isVip?: boolean;
  floorWidthM?: number;
  floorDepthM?: number;
  /** From room list enrichment — used if detail equipment fetch fails. */
  equipmentCategories?: string[];
};

type Room3DDialogProps = {
  open: boolean;
  room: Room3DTarget | null;
  onClose: () => void;
};

const VIEWPORT_HEIGHT = 480;

const KNOWN_CATEGORIES: EquipmentCategory[] = [
  "PROJECTOR",
  "DISPLAY",
  "AUDIO",
  "VC",
  "MICROPHONE",
  "OTHER",
];

function categoryFallbackEquipment(
  categories: string[] | undefined,
): LayoutEquipmentInput[] {
  if (!categories?.length) return [];
  return categories
    .filter((c): c is EquipmentCategory =>
      (KNOWN_CATEGORIES as string[]).includes(c),
    )
    .map((category) => ({
      equipmentName: category,
      category,
      quantity: 1,
      status: "OK" as const,
    }));
}

export function Room3DDialog({ open, room, onClose }: Room3DDialogProps) {
  const [equipment, setEquipment] = useState<RoomEquipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sceneReady, setSceneReady] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open || !room) {
      abortRef.current?.abort();
      abortRef.current = null;
      setEquipment([]);
      setError("");
      setLoading(false);
      setSceneReady(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    setLoading(true);
    setError("");

    void getRoomEquipment(room.id, controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        setEquipment(items);
        setError("");
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || isAbortError(err)) return;
        // Soft-fail: still render from room.equipmentCategories when present.
        setEquipment([]);
        const hasFallback = (room.equipmentCategories?.length ?? 0) > 0;
        setError(
          hasFallback
            ? ""
            : err instanceof Error
              ? err.message
              : "Không tải được thiết bị của phòng",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [open, room?.id]);

  const layoutEquipment = useMemo((): LayoutEquipmentInput[] => {
    if (equipment.length > 0) {
      return equipment.map((eq) => ({
        equipmentName: eq.equipmentName,
        category: eq.category as EquipmentCategory,
        quantity: eq.quantity,
        status: eq.status,
      }));
    }
    return categoryFallbackEquipment(room?.equipmentCategories);
  }, [equipment, room?.equipmentCategories]);

  const layout = useMemo(() => {
    if (!room) return null;
    return buildRoom3DLayout({
      capacity: room.capacity,
      isVip: room.isVip,
      floorWidthM: room.floorWidthM,
      floorDepthM: room.floorDepthM,
      equipment: layoutEquipment,
    });
  }, [room, layoutEquipment]);

  const activeCount =
    equipment.length > 0
      ? equipment.reduce(
          (sum, eq) => (eq.status !== "RETIRED" ? sum + eq.quantity : sum),
          0,
        )
      : layoutEquipment.length;

  return (
    <Modal
      title={
        room ? (
          <Space size={8} wrap>
            <span>Xem 3D — {room.name}</span>
            {room.isVip ? <Tag color="gold">VIP</Tag> : null}
          </Space>
        ) : (
          "Xem 3D phòng họp"
        )
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={920}
      destroyOnHidden
      styles={{ body: { paddingTop: 12 } }}
      afterOpenChange={(visible) => {
        if (!visible) {
          setSceneReady(false);
          return;
        }
        // Mount WebGL after modal layout + open animation (R3F reads 0×0 if too early).
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setSceneReady(true));
        });
      }}
    >
      {room ? (
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
          {room.capacity} chỗ · {activeCount} thiết bị · Kéo xoay · Cuộn zoom
        </Typography.Paragraph>
      ) : null}

      <ErrorMessage message={error} style={{ marginBottom: 12 }} />

      <div
        style={{
          width: "100%",
          height: VIEWPORT_HEIGHT,
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid var(--ant-color-border-secondary, #f0f0f0)",
          position: "relative",
        }}
      >
        {loading ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LoadingSpinner tip="Đang tải thiết bị…" />
          </div>
        ) : layout && sceneReady ? (
          <Room3DScene layout={layout} />
        ) : null}
      </div>
    </Modal>
  );
}
