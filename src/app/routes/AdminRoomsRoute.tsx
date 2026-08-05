import AdminRoomsPage from "@/features/rooms/components/AdminRoomsPage";
import { useDepartments } from "@/features/departments/api/departments.hooks";

/** Composes departments lookup + rooms admin UI (no cross-feature imports in rooms). */
export default function AdminRoomsRoute() {
  const { data: departments, isLoading: departmentsLoading } = useDepartments();

  return (
    <AdminRoomsPage
      departments={departments}
      departmentsLoading={departmentsLoading}
    />
  );
}
