import { useMemo, useState } from "react";
import { Button, Form, Input, Select } from "antd";
import { ConfirmDialog } from "@/components/ui/dialog/ConfirmDialog";
import { CreateDialog } from "@/components/ui/dialog/CreateDialog";
import { DataTable } from "@/components/ui/table/DataTable";
import { DeleteButton } from "@/components/ui/button/DeleteButton";
import { DeleteDialog } from "@/components/ui/dialog/DeleteDialog";
import { EditButton } from "@/components/ui/button/EditButton";
import { EditDialog } from "@/components/ui/dialog/EditDialog";
import { ErrorPage } from "@/components/ui/error/ErrorPage";
import { NoData } from "@/components/ui/empty/NoData";
import { NoSearchResult } from "@/components/ui/empty/NoSearchResult";
import { PageContent } from "@/components/ui/page/PageContent";
import { PageHeader } from "@/components/ui/page/PageHeader";
import { PageLayout } from "@/components/ui/page/PageLayout";
import { RefreshButton } from "@/components/ui/toolbar/RefreshButton";
import { RetryButton } from "@/components/ui/error/RetryButton";
import { SearchForm } from "@/components/ui/search/SearchForm";
import { SearchInput } from "@/components/ui/search/SearchInput";
import { StatusBadge } from "@/components/ui/status/StatusBadge";
import { TableRowActions } from "@/components/ui/table/TableRowActions";
import { TabBar } from "@/components/ui/tabs/TabBar";
import { defineTabItems } from "@/components/ui/tabs/TabItem";
import { actionsColumn, defineColumns } from "@/components/ui/table/columnDefs";
import { useToast } from "@/components/ui/feedback/useFeedback";
import { useDepartments } from "@/features/departments/api/departments.hooks";
import {
  usePendingDepartmentChanges,
  useUsers,
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
import type { UserRole } from "@/features/auth/api/auth.types";
import { getApiErrorMessage } from "@/lib/api-error";

type UserFormValues = {
  email: string;
  fullName: string;
  password?: string;
  role: UserRole;
  departmentId?: number | null;
};

const ACTIVE_LABEL: Record<string, string> = {
  true: "Hoạt động",
  false: "Ngừng",
};
const ACTIVE_COLOR: Record<string, string> = {
  true: "green",
  false: "default",
};

export default function AdminUsersPage() {
  const toast = useToast();
  const { data: users, error, isLoading, refetch } = useUsers();
  const {
    data: pendingRequests,
    error: pendingError,
    isLoading: pendingLoading,
    refetch: refetchPending,
  } = usePendingDepartmentChanges();
  const [tab, setTab] = useState("users");
  const [search, setSearch] = useState("");
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
  const [form] = Form.useForm<UserFormValues>();

  const { data: departments } = useDepartments(modalOpen);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      role: "USER",
      departmentId: null,
    });
    setModalOpen(true);
  };

  const openEdit = (user: ManagedUser) => {
    setEditing(user);
    form.setFieldsValue({
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      departmentId: user.department?.id ?? null,
      password: undefined,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const handleSubmit = async (values: UserFormValues) => {
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
          password: values.password,
        });
        toast.success("Cập nhật user thành công");
      } else {
        await createUser({
          email: values.email,
          fullName: values.fullName,
          password: values.password ?? "",
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
    try {
      await approveDepartmentChange(req.id);
      toast.success("Đã duyệt đổi phòng ban");
      await Promise.all([refetchPending(), refetch()]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Duyệt thất bại"));
    }
  };

  const handleReject = async (req: DepartmentChangeRequest) => {
    try {
      await rejectDepartmentChange(req.id);
      toast.success("Đã từ chối yêu cầu");
      await refetchPending();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Từ chối thất bại"));
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        (u.department?.name ?? "").toLowerCase().includes(q),
    );
  }, [users, search]);

  const departmentOptions = departments.map((d) => ({
    value: d.id,
    label: `${d.name} (${d.code})`,
  }));

  const userForm = (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item
        label="Họ tên"
        name="fullName"
        rules={[{ required: true, message: "Nhập họ tên" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: "Nhập email" },
          { type: "email", message: "Email không hợp lệ" },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label={editing ? "Mật khẩu mới (tuỳ chọn)" : "Mật khẩu"}
        name="password"
        rules={
          editing
            ? []
            : [
                { required: true, message: "Nhập mật khẩu" },
                { min: 4, message: "Tối thiểu 4 ký tự" },
              ]
        }
      >
        <Input.Password />
      </Form.Item>
      <Form.Item
        label="Vai trò"
        name="role"
        rules={[{ required: true, message: "Chọn vai trò" }]}
      >
        <Select
          options={[
            { value: "USER", label: "USER" },
            { value: "ADMIN", label: "ADMIN" },
          ]}
        />
      </Form.Item>
      <Form.Item label="Phòng ban" name="departmentId">
        <Select
          allowClear
          placeholder="Chưa gán"
          options={departmentOptions}
        />
      </Form.Item>
    </Form>
  );

  const userColumns = defineColumns<ManagedUser>([
    { title: "Họ tên", dataIndex: "fullName", key: "fullName" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Vai trò", dataIndex: "role", key: "role" },
    {
      title: "Phòng ban",
      key: "department",
      render: (_, u) => u.department?.name ?? "—",
    },
    {
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
    },
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
              type="primary"
              onClick={() => setActivateTarget(user)}
            >
              Kích hoạt lại
            </Button>
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
      <TableRowActions>
        <Button
          size="small"
          type="primary"
          onClick={() => void handleApprove(req)}
        >
          Duyệt
        </Button>
        <DeleteButton onClick={() => void handleReject(req)}>
          Từ chối
        </DeleteButton>
      </TableRowActions>
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
            <Button type="primary" onClick={openCreate}>
              Thêm user
            </Button>
          ) : null
        }
      >
        {tab === "users" ? (
          <SearchForm
            onReset={() => {
              setSearch("");
            }}
          >
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Tìm theo tên, email, phòng ban…"
            />
          </SearchForm>
        ) : null}
      </PageHeader>

      <PageContent>
        <TabBar
          activeKey={tab}
          items={tabs}
          onChange={setTab}
          style={{ marginBottom: 16 }}
        />

        {tab === "users" ? (
          error ? (
            <ErrorPage
              description={getApiErrorMessage(error, "Không tải được user")}
              extra={
                <RetryButton
                  onRetry={() => void refetch()}
                  loading={isLoading}
                />
              }
            />
          ) : (
            <DataTable
              rowKey="id"
              columns={userColumns}
              data={filteredUsers}
              loading={isLoading}
              scroll={{ x: true }}
              emptyText={
                search.trim() ? (
                  <NoSearchResult onReset={() => setSearch("")} />
                ) : (
                  <NoData description="Chưa có user" />
                )
              }
              toolbarExtra={
                <RefreshButton
                  loading={isLoading}
                  onClick={() => void refetch()}
                />
              }
            />
          )
        ) : pendingError ? (
          <ErrorPage
            description={getApiErrorMessage(
              pendingError,
              "Không tải được yêu cầu",
            )}
            extra={
              <RetryButton
                onRetry={() => void refetchPending()}
                loading={pendingLoading}
              />
            }
          />
        ) : (
          <DataTable
            rowKey="id"
            columns={requestColumns}
            data={pendingRequests}
            loading={pendingLoading}
            scroll={{ x: true }}
            emptyText={<NoData description="Không có yêu cầu chờ duyệt" />}
            toolbarExtra={
              <RefreshButton
                loading={pendingLoading}
                onClick={() => void refetchPending()}
              />
            }
          />
        )}
      </PageContent>

      {editing ? (
        <EditDialog
          title="Sửa user"
          open={modalOpen}
          onCancel={closeModal}
          onOk={() => form.submit()}
          confirmLoading={submitting}
        >
          {userForm}
        </EditDialog>
      ) : (
        <CreateDialog
          title="Thêm user"
          open={modalOpen}
          onCancel={closeModal}
          onOk={() => form.submit()}
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
