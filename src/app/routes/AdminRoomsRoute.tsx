import { useState } from "react";
import AdminRoomsPage from "@/features/rooms/components/AdminRoomsPage";
import { useDepartments } from "@/features/departments/api/departments.hooks";
import { Room3DDialog } from "@/app/components/Room3DDialog";
import type { Room } from "@/features/rooms/api/rooms.types";

/** Composes departments lookup + rooms admin UI (no cross-feature imports in rooms). */
export default function AdminRoomsRoute() {
  const { data: departments, isLoading: departmentsLoading } = useDepartments();
  const [room3d, setRoom3d] = useState<Room | null>(null);

  return (
    <>
      <AdminRoomsPage
        departments={departments}
        departmentsLoading={departmentsLoading}
        onView3D={setRoom3d}
      />
      <Room3DDialog
        open={room3d != null}
        room={room3d}
        onClose={() => setRoom3d(null)}
      />
    </>
  );
}
