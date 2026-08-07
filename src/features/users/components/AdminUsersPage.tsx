import { useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { useLocation } from "react-router";
import { ConfirmDialog } from "@/components/ui/dialog/ConfirmDialog";
import { CreateDialog } from "@/components/ui/dialog/CreateDialog";
import { DataTable } from "@/components/ui/table/DataTable";
import { DeleteButton } from "@/components/ui/button/DeleteButton";
import { DeleteDialog } from "@/components/ui/dialog/DeleteDialog";
import { EditButton } from "@/components/ui/button/EditButton";
import { EditDialog } from "@/components/ui/dialog/EditDialog";
import { FetchError } from "@/components/ui/error/FetchError";
import { NoData } from "@/components/ui/empty/NoData";
import { NoSearchResult } from "@/components/ui/empty/NoSearchResult";
import { PageContent } from "@/components/ui/page/PageContent";
import { PageHeader } from "@/components/ui/page/PageHeader";
import { PageLayout } from "@/components/ui/page/PageLayout";
import { RefreshButton } from "@/components/ui/toolbar/RefreshButton";
import { SearchForm } from "@/components/ui/search/SearchForm";
import { SearchInput } from "@/components/ui/search/SearchInput";
import { StatusFilter } from "@/components/ui/search/StatusFilter";
import { StatusBadge } from "@/components/ui/status/StatusBadge";
import { TableRowActions } from "@/components/ui/table/TableRowActions";
import { ApproveRejectActions } from "@/components/ui/table/ApproveRejectActions";
import { TabBar } from "@/components/ui/tabs/TabBar";
import { defineTabItems } from "@/components/ui/tabs/TabItem";
import { actionsColumn, defineColumns, sortableColumn } from "@/components/ui/table/columnDefs";
import { useToast } from "@/components/ui/feedback/useFeedback";
import {
  usePendingDepartmentChanges,
  useUsersPage,
} from "@/features/users/api/users.hooks";
import {
  approveDepartmentChange,
  createUser,
  deactivateUser,
  rejectDepartmentChange,
  updateUser,
} from "@/features/users/api/users.service";
import type {
  DepartmentChangeRequest,
  ManagedUser,
} from "@/features/users/api/users.types";
import { getApiErrorMessage } from "@/lib/api-error";
import { emitNotificationsChanged } from "@/lib/notification-events";
import { parseNotificationFlash } from "@/lib/notificationNav";
import type { Department } from "@/lib/types/department";
import type { UserRole } from "@/lib/types/user";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useServerTableQuery } from "@/lib/useServerTableQuery";
import { useTableRowHighlight } from "@/lib/useTableRowHighlight";
import { useUrlTab } from "@/lib/useUrlTab";

type UserFormValues = {
  email: string;
  fullName: string;
  password: string;
  role: UserRole;
  departmentId: number | null;
};

type UserActiveFilter = "ACTIVE" | "INACTIVE";
type UsersTab = "users" | "requests";

const EMPTY_FORM: UserFormValues = {
  email: "",
  fullName: "",
  password: "",
  role: "USER",
  departmentId: null,
};

const fieldErrorStyle = { color: "var(--p-red-500, #ef4444)", display: "block" as const };

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export type AdminUsersPageProps = {
  departments: Department[];
  departmentsLoading?: boolean;
};

function parseUsersTab(raw: string | null): UsersTab {
  return raw === "requests" ? "requests" : "users";
}

const USERS_HIGHLIGHT_TABS = ["requests"] as const;

const USER_STATUS_OPTIONS = [
  { value: "ACTIVE" as const, label: "Hoạt động" },
  { value: "INACTIVE" as const, label: "Ngừng" },
];

const ACTIVE_LABEL: Record<string, string> = {
  true: "Hoạt động",
  false: "Ngừng",
};
const ACTIVE_COLOR: Record<string, string> = {
  true: "green",
  false: "default",
};

const ROLE_OPTIONS = [
  { value: "USER" as const, label: "USER" },
  { value: "ADMIN" as const, label: "ADMIN" },
];

export default function AdminUsersPage({
  departments,
}: AdminUsersPageProps) {
  const toast = useToast();
  const location = useLocation();
  const { tab, setTab, searchParams, setSearchParams } = useUrlTab({
    defaultTab: "users",
    parse: parseUsersTab,
    highlightTabs: USERS_HIGHLIGHT_TABS,
  });
  const { query, setQuery, pageParams, resetPage } =
    useServerTableQuery();
  const {
    data: pendingRequests,
    error: pendingError,
    isLoading: pendingLoading,
    refetch: refetchPending,
  } = usePendingDepartmentChanges();
  const [search, setSearch] = useState("");
  const debouncedQ = useDebouncedValue(search.trim(), 300);
  const [statusFilter, setStatusFilter] = useState<UserActiveFilter | "ALL">(
    "ALL",
  );
  const [requestSearch, setRequestSearch] = useState("");

  useEffect(() => {
    resetPage();
  }, [debouncedQ, resetPage]);

  const hasFilters = Boolean(debouncedQ) || statusFilter !== "ALL";
  const pageOpts = {
    ...pageParams,
    ...(debouncedQ ? { q: debouncedQ } : {}),
    ...(statusFilter === "ACTIVE"
      ? { activated: true as const }
      : statusFilter === "INACTIVE"
        ? { activated: false as const }
        : {}),
  };
  const { data: usersPage, error, isLoading, refetch } = useUsersPage(
    pageOpts,
    tab === "users",
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<ManagedUser | null>(
    null,
  );
  const [activateTarget, setActivateTarget] = useState<ManagedUser | null>(
    null,
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [actingRequestId, setActingRequestId] = useState<number | null>(null);
  const [values, setValues] = useState<UserFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const openCreate = () => {
    setEditing(null);
    setValues({ ...EMPTY_FORM });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (user: ManagedUser) => {
    setEditing(user);
    setValues({
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      departmentId: user.department?.id ?? null,
      password: "",
    });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setValues({ ...EMPTY_FORM });
    setErrors({});
  };

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!values.fullName.trim()) next.fullName = "Nhập họ tên";
    if (!values.email.trim()) next.email = "Nhập email";
    else if (!isValidEmail(values.email.trim())) next.email = "Email không hợp lệ";
    if (!editing) {
      if (!values.password) next.password = "Nhập mật khẩu";
      else if (values.password.length < 4) next.password = "Tối thiểu 4 ký tự";
    }
    if (!values.role) next.role = "Chọn vai trò";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (editing) {
        await updateUser({
          id: editing.id,
          login: values.email,
          email: values.email,
          fullName: values.fullName,
          role: values.role,
          activated: editing.activated,
          departmentId: values.departmentId ?? null,
          password: values.password || undefined,
        });
        toast.success("Cập nhật user thành công");
      } else {
        await createUser({
          email: values.email,
          fullName: values.fullName,
          password: values.password,
          role: values.role,
          departmentId: values.departmentId ?? null,
          activated: true,
        });
        toast.success("Tạo user thành công");
      }
      closeModal();
      await refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Thao tác thất bại"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setActionLoading(true);
    try {
      await deactivateUser(deactivateTarget.login);
      toast.success(`Đã vô hiệu hóa ${deactivateTarget.email}`);
      setDeactivateTarget(null);
      await refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không vô hiệu hóa được"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!activateTarget) return;
    setActionLoading(true);
    try {
      await updateUser({
        id: activateTarget.id,
        login: activateTarget.login,
        email: activateTarget.email,
        fullName: activateTarget.fullName,
        role: activateTarget.role,
        activated: true,
        departmentId: activateTarget.department?.id ?? null,
      });
      toast.success(`Đã kích hoạt lại ${activateTarget.email}`);
      setActivateTarget(null);
      await refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không kích hoạt lại được"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (req: DepartmentChangeRequest) => {
    setActingRequestId(req.id);
    try {
      await approveDepartmentChange(req.id);
      toast.success("Đã duyệt đổi phòng ban");
      await Promise.all([refetchPending(), refetch()]);
      emitNotificationsChanged();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Duyệt thất bại"));
    } finally {
      setActingRequestId(null);
    }
  };

  const handleReject = async (req: DepartmentChangeRequest) => {
    setActingRequestId(req.id);
    try {
      await rejectDepartmentChange(req.id);
      toast.success("Đã từ chối yêu cầu");
      await refetchPending();
      emitNotificationsChanged();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Từ chối thất bại"));
    } finally {
      setActingRequestId(null);
    }
  };

  const filteredRequests = useMemo(() => {
    const q = requestSearch.trim().toLowerCase();
    if (!q) return pendingRequests;
    return pendingRequests.filter((r) => {
      const haystack = [
        r.userFullName,
        r.userEmail,
        r.currentDepartment?.name ?? "",
        r.requestedDepartment.name,
        r.requestedDepartment.code,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [pendingRequests, requestSearch]);

  const flashKey = parseNotificationFlash(location.state);

  const highlightIdParam = searchParams.get("highlight");
  const requestRowsForHighlight = useMemo(() => {
    if (!highlightIdParam || !/^\d+$/.test(highlightIdParam)) {
      return filteredRequests;
    }
    const id = Number(highlightIdParam);
    // Prefer unfiltered pending list so search does not hide the deep-linked row.
    if (pendingRequests.some((r) => r.id === id)) {
      return pendingRequests;
    }
    return filteredRequests;
  }, [filteredRequests, pendingRequests, highlightIdParam]);

  const displayRequests =
    highlightIdParam && /^\d+$/.test(highlightIdParam)
      ? requestRowsForHighlight
      : filteredRequests;

  const { onRow: requestOnRow, rowClassName: requestRowClassName } =
    useTableRowHighlight({
      searchParams,
      setSearchParams,
      ready: tab === "requests" && !pendingLoading,
      rowIds: displayRequests.map((r) => r.id),
      missingMessage:
        "Yêu cầu đổi phòng ban không còn trong danh sách chờ duyệt (có thể đã được xử lý).",
      flashKey,
    });

  const resetUserFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    resetPage();
  };

  const departmentOptions = departments.map((d) => ({
    value: d.id,
    label: `${d.name} (${d.code})`,
  }));

  const userForm = (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label htmlFor="user-fullName" style={{ display: "block", marginBottom: 6 }}>
          Họ tên
        </label>
        <InputText
          id="user-fullName"
          value={values.fullName}
          onChange={(e) => setValues((v) => ({ ...v, fullName: e.target.value }))}
          style={{ width: "100%" }}
        />
        {errors.fullName ? <small style={fieldErrorStyle}>{errors.fullName}</small> : null}
      </div>
      <div>
        <label htmlFor="user-email" style={{ display: "block", marginBottom: 6 }}>
          Email
        </label>
        <InputText
          id="user-email"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          style={{ width: "100%" }}
        />
        {errors.email ? <small style={fieldErrorStyle}>{errors.email}</small> : null}
      </div>
      <div>
        <label htmlFor="user-password" style={{ display: "block", marginBottom: 6 }}>
          {editing ? "Mật khẩu mới (tuỳ chọn)" : "Mật khẩu"}
        </label>
        <Password
          inputId="user-password"
          value={values.password}
          onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
          feedback={false}
          toggleMask
          style={{ width: "100%" }}
          inputStyle={{ width: "100%" }}
        />
        {errors.password ? <small style={fieldErrorStyle}>{errors.password}</small> : null}
      </div>
      <div>
        <label htmlFor="user-role" style={{ display: "block", marginBottom: 6 }}>
          Vai trò
        </label>
        <Dropdown
          inputId="user-role"
          value={values.role}
          onChange={(e) => setValues((v) => ({ ...v, role: e.value }))}
          options={ROLE_OPTIONS}
          optionLabel="label"
          optionValue="value"
          style={{ width: "100%" }}
        />
        {errors.role ? <small style={fieldErrorStyle}>{errors.role}</small> : null}
      </div>
      <div>
        <label htmlFor="user-dept" style={{ display: "block", marginBottom: 6 }}>
          Phòng ban
        </label>
        <Dropdown
          inputId="user-dept"
          value={values.departmentId}
          onChange={(e) =>
            setValues((v) => ({ ...v, departmentId: e.value ?? null }))
          }
          options={departmentOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Chưa gán"
          showClear
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );

  const userColumns = defineColumns<ManagedUser>([
    sortableColumn<ManagedUser>({
      title: "Họ tên",
      dataIndex: "fullName",
      key: "fullName",
    }),
    sortableColumn<ManagedUser>({
      title: "Email",
      dataIndex: "email",
      key: "email",
    }),
    { title: "Vai trò", dataIndex: "role", key: "role" },
    {
      title: "Phòng ban",
      key: "department",
      render: (_, u) => u.department?.name ?? "—",
    },
    sortableColumn<ManagedUser>({
      title: "Trạng thái",
      dataIndex: "activated",
      key: "activated",
      render: (activated: boolean) => (
        <StatusBadge
          status={activated}
          colorMap={ACTIVE_COLOR}
          labelMap={ACTIVE_LABEL}
        />
      ),
    }),
    actionsColumn<ManagedUser>((_, user) => (
      <TableRowActions>
        <EditButton onClick={() => openEdit(user)} />
        {user.role === "USER" ? (
          user.activated ? (
            <DeleteButton onClick={() => setDeactivateTarget(user)}>
              Vô hiệu hóa
            </DeleteButton>
          ) : (
            <Button
              size="small"
              label="Kích hoạt lại"
              onClick={() => setActivateTarget(user)}
            />
          )
        ) : null}
      </TableRowActions>
    )),
  ]);

  const requestColumns = defineColumns<DepartmentChangeRequest>([
    { title: "User", dataIndex: "userFullName", key: "userFullName" },
    { title: "Email", dataIndex: "userEmail", key: "userEmail" },
    {
      title: "Hiện tại",
      key: "current",
      render: (_, r) => r.currentDepartment?.name ?? "—",
    },
    {
      title: "Yêu cầu sang",
      key: "requested",
      render: (_, r) =>
        `${r.requestedDepartment.name} (${r.requestedDepartment.code})`,
    },
    actionsColumn<DepartmentChangeRequest>((_, req) => (
      <ApproveRejectActions
        loading={actingRequestId === req.id}
        onApprove={() => void handleApprove(req)}
        onReject={() => void handleReject(req)}
      />
    )),
  ]);

  const tabs = defineTabItems([
    { key: "users", label: "Danh sách user" },
    {
      key: "requests",
      label: `Đổi phòng ban (${pendingRequests.length})`,
    },
  ]);

  return (
    <PageLayout>
      <PageHeader
        title="Quản lý user"
        extra={
          tab === "users" ? (
            <Button label="Thêm user" onClick={openCreate} />
          ) : null
        }
      />

      <PageContent>
        <TabBar
          activeKey={tab}
          items={tabs}
          onChange={setTab}
          style={{ marginBottom: 16 }}
        />

        {tab === "users" ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <SearchForm onReset={resetUserFilters}>
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Tìm theo tên, email, phòng ban…"
                />
                <StatusFilter<UserActiveFilter>
                  value={statusFilter}
                  onChange={(value) => {
                    setStatusFilter(value);
                    resetPage();
                  }}
                  options={USER_STATUS_OPTIONS}
                  allLabel="Tất cả trạng thái"
                />
              </SearchForm>
            </div>
            {error ? (
              <FetchError
                error={error}
                fallback="Không tải được user"
                onRetry={() => void refetch()}
                loading={isLoading}
              />
            ) : (
              <DataTable
                rowKey="id"
                columns={userColumns}
                data={usersPage.items}
                loading={isLoading}
                scroll={{ x: true }}
                emptyText={
                  hasFilters ? (
                    <NoSearchResult onReset={resetUserFilters} />
                  ) : (
                    <NoData description="Chưa có user" />
                  )
                }
                serverSide
                total={usersPage.totalElements}
                page={query.page}
                pageSize={query.pageSize}
                sort={query.sort}
                onQueryChange={setQuery}
                toolbarExtra={
                  <RefreshButton
                    loading={isLoading}
                    onClick={() => void refetch()}
                  />
                }
              />
            )}
          </>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <SearchForm onReset={() => setRequestSearch("")}>
                <SearchInput
                  value={requestSearch}
                  onChange={setRequestSearch}
                  placeholder="Tìm theo user, email, phòng ban…"
                />
              </SearchForm>
            </div>
            {pendingError ? (
              <FetchError
                error={pendingError}
                fallback="Không tải được yêu cầu"
                onRetry={() => void refetchPending()}
                loading={pendingLoading}
              />
            ) : (
              <DataTable
                key={requestSearch}
                rowKey="id"
                columns={requestColumns}
                data={displayRequests}
                loading={pendingLoading}
                scroll={{ x: true }}
                onRow={requestOnRow}
                rowClassName={requestRowClassName}
                emptyText={
                  requestSearch.trim() ? (
                    <NoSearchResult onReset={() => setRequestSearch("")} />
                  ) : (
                    <NoData description="Không có yêu cầu chờ duyệt" />
                  )
                }
                toolbarExtra={
                  <RefreshButton
                    loading={pendingLoading}
                    onClick={() => void refetchPending()}
                  />
                }
              />
            )}
          </>
        )}
      </PageContent>

      {editing ? (
        <EditDialog
          title="Sửa user"
          open={modalOpen}
          onCancel={closeModal}
          onOk={() => void handleSubmit()}
          confirmLoading={submitting}
        >
          {userForm}
        </EditDialog>
      ) : (
        <CreateDialog
          title="Thêm user"
          open={modalOpen}
          onCancel={closeModal}
          onOk={() => void handleSubmit()}
          confirmLoading={submitting}
        >
          {userForm}
        </CreateDialog>
      )}

      <DeleteDialog
        open={Boolean(deactivateTarget)}
        title="Vô hiệu hóa user này?"
        content="User sẽ không đăng nhập được sau khi vô hiệu hóa."
        okText="Xác nhận"
        confirmLoading={actionLoading}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
      />

      <ConfirmDialog
        open={Boolean(activateTarget)}
        title="Kích hoạt lại user này?"
        content="User sẽ đăng nhập được sau khi kích hoạt."
        confirmLoading={actionLoading}
        onCancel={() => setActivateTarget(null)}
        onConfirm={handleActivate}
      />
    </PageLayout>
  );
}
