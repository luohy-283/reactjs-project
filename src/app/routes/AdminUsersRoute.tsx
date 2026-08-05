import AdminUsersPage from "@/features/users/components/AdminUsersPage";
import { useDepartments } from "@/features/departments/api/departments.hooks";

/** Composes departments lookup + users admin UI (no cross-feature imports in users). */
export default function AdminUsersRoute() {
  const { data: departments, isLoading: departmentsLoading } = useDepartments();

  return (
    <AdminUsersPage
      departments={departments}
      departmentsLoading={departmentsLoading}
    />
  );
}
