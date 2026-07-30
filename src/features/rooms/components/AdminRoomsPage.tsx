import { useMemo, useState } from "react";
import { Button, Form, Input, InputNumber, Select } from "antd";
import { ConfirmDialog } from "@/components/ui/dialog/ConfirmDialog";
import { CreateDialog } from "@/components/ui/dialog/CreateDialog";
import { DataTable } from "@/components/ui/table/DataTable";
import { DeleteButton } from "@/components/ui/button/DeleteButton";
import { DeleteDialog } from "@/components/ui/dialog/DeleteDialog";
import { EditButton } from "@/components/ui/button/EditButton";
import { EditDialog } from "@/components/ui/dialog/EditDialog";
import { ErrorPage } from "@/components/ui/error/ErrorPage";
import { PageContent } from "@/components/ui/page/PageContent";
import { PageHeader } from "@/components/ui/page/PageHeader";
import { PageLayout } from "@/components/ui/page/PageLayout";
import { RetryButton } from "@/components/ui/error/RetryButton";
import { SearchForm } from "@/components/ui/search/SearchForm";
import { SearchInput } from "@/components/ui/search/SearchInput";
import { StatusBadge } from "@/components/ui/status/StatusBadge";
import { StatusFilter } from "@/components/ui/search/StatusFilter";
import { NoData } from "@/components/ui/empty/NoData";
import { NoSearchResult } from "@/components/ui/empty/NoSearchResult";
import { RefreshButton } from "@/components/ui/toolbar/RefreshButton";
import { TableRowActions } from "@/components/ui/table/TableRowActions";
import { actionsColumn, defineColumns } from "@/components/ui/table/columnDefs";
import { useAppModal, useToast } from "@/components/ui/feedback/useFeedback";
import { useDepartments } from "@/features/departments/api/departments.hooks";
import { createRoom, updateRoom } from "@/features/rooms/api/rooms.service";
import { useRooms } from "@/features/rooms/api/rooms.hooks";
import type { Room } from "@/features/rooms/api/rooms.types";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatVnd } from "@/lib/money";

type RoomActiveFilter = "ACTIVE" | "INACTIVE";

type RoomFormValues = {
  name: string;
  capacity: number;
  lockedDepartmentId?: number | null;
  pricePerHour: number;
};

const ROOM_STATUS_OPTIONS = [
  { value: "ACTIVE" as const, label: "Đang hoạt động" },
  { value: "INACTIVE" as const, label: "Ngừng hoạt động" },
];

const ROOM_ACTIVE_LABEL: Record<string, string> = {
  true: "Đang hoạt động",
  false: "Ngừng hoạt động",
};

const ROOM_ACTIVE_COLOR: Record<string, string> = {
  true: "green",
  false: "default",
};

export default function AdminRoomsPage() {
  const toast = useToast();
  const appModal = useAppModal();
  const { data: rooms, error, isLoading, refetch } = useRooms();
  const { data: departments } = useDepartments();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RoomActiveFilter | "ALL">(
    "ALL",
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Room | null>(null);
  const [activateTarget, setActivateTarget] = useState<Room | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [form] = Form.useForm<RoomFormValues>();

  const openCreateModal = () => {
    setEditingRoom(null);
    form.resetFields();
    form.setFieldsValue({ lockedDepartmentId: null, pricePerHour: 100000 });
    setModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    form.setFieldsValue({
      name: room.name,
      capacity: room.capacity,
      lockedDepartmentId: room.lockedDepartment?.id ?? null,
      pricePerHour: room.pricePerHour,
    });
    setModalOpen(true);
  };

  const closeFormModal = () => {
    setModalOpen(false);
    setEditingRoom(null);
    form.resetFields();
  };

  const handleSubmit = async (values: RoomFormValues) => {
    setSubmitting(true);
    try {
      const lockedDepartmentId = values.lockedDepartmentId ?? null;
      if (editingRoom) {
        await updateRoom({
          id: editingRoom.id,
          name: values.name,
          capacity: values.capacity,
          isActive: editingRoom.isActive,
          lockedDepartmentId,
          pricePerHour: values.pricePerHour,
        });
        toast.success("Cập nhật phòng thành công");
      } else {
        await createRoom({
          name: values.name,
          capacity: values.capacity,
          lockedDepartmentId,
          pricePerHour: values.pricePerHour,
        });
        toast.success("Thêm phòng thành công");
      }
      closeFormModal();
      await refetch();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setActionLoading(true);
    try {
      await updateRoom({ id: deactivateTarget.id, isActive: false });
      toast.success(`Đã vô hiệu hóa ${deactivateTarget.name}`);
      setDeactivateTarget(null);
      await refetch();
    } catch (err) {
      setDeactivateTarget(null);
      appModal.warning({
        title: "Không thể vô hiệu hóa phòng",
        content: getApiErrorMessage(
          err,
          "Phòng đang có lịch đặt (chờ duyệt hoặc đã duyệt chưa kết thúc). Hãy xử lý các lịch đó trước.",
        ),
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!activateTarget) return;
    setActionLoading(true);
    try {
      await updateRoom({ id: activateTarget.id, isActive: true });
      toast.success(`Đã kích hoạt lại ${activateTarget.name}`);
      setActivateTarget(null);
      await refetch();
    } catch (err) {
      setActivateTarget(null);
      appModal.error({
        title: "Không thể kích hoạt phòng",
        content: getApiErrorMessage(err, "Không kích hoạt lại được phòng"),
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRooms = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rooms.filter((room) => {
      if (statusFilter === "ACTIVE" && !room.isActive) return false;
      if (statusFilter === "INACTIVE" && room.isActive) return false;
      if (!q) return true;
      return (
        room.name.toLowerCase().includes(q) ||
        String(room.capacity).includes(q) ||
        (room.lockedDepartment?.name ?? "chung").toLowerCase().includes(q)
      );
    });
  }, [rooms, search, statusFilter]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
  };

  const hasActiveFilters = Boolean(search.trim()) || statusFilter !== "ALL";

  const tableEmpty = hasActiveFilters ? (
    <NoSearchResult onReset={resetFilters} />
  ) : (
    <NoData description="Chưa có phòng họp" />
  );

  const departmentOptions = [
    { value: null as number | null, label: "Công khai (mọi phòng ban)" },
    ...departments.map((d) => ({
      value: d.id,
      label: `${d.name} (${d.code})`,
    })),
  ];

  const roomForm = (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item
        label="Tên phòng"
        name="name"
        rules={[{ required: true, message: "Vui lòng nhập tên phòng" }]}
      >
        <Input placeholder="VD: Phòng Coda" />
      </Form.Item>

      <Form.Item
        label="Sức chứa"
        name="capacity"
        rules={[
          { required: true, message: "Vui lòng nhập sức chứa" },
          {
            type: "number",
            min: 1,
            message: "Sức chứa phải lớn hơn 0",
          },
        ]}
      >
        <InputNumber min={1} style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item
        label="Giá thuê / giờ (VND)"
        name="pricePerHour"
        rules={[
          { required: true, message: "Vui lòng nhập giá" },
          { type: "number", min: 0, message: "Giá không âm" },
        ]}
      >
        <InputNumber min={0} step={10000} style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item
        label="Khóa theo phòng ban"
        name="lockedDepartmentId"
        tooltip="Công khai: mọi đơn vị đều thấy. Chọn 1 phòng ban: chỉ đơn vị đó (và admin) thấy/đặt."
      >
        <Select
          allowClear
          placeholder="Công khai (mọi phòng ban)"
          options={departmentOptions}
        />
      </Form.Item>
    </Form>
  );

  const columns = defineColumns<Room>([
    { title: "Tên phòng", dataIndex: "name", key: "name" },
    { title: "Sức chứa", dataIndex: "capacity", key: "capacity" },
    {
      title: "Giá / giờ",
      dataIndex: "pricePerHour",
      key: "pricePerHour",
      render: (price: number) => formatVnd(price),
    },
    {
      title: "Phạm vi",
      key: "lockedDepartment",
      render: (_, room) =>
        room.lockedDepartment
          ? `${room.lockedDepartment.name} (${room.lockedDepartment.code})`
          : "Công khai",
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <StatusBadge
          status={isActive}
          colorMap={ROOM_ACTIVE_COLOR}
          labelMap={ROOM_ACTIVE_LABEL}
        />
      ),
    },
    actionsColumn<Room>((_, room) => (
      <TableRowActions>
        <EditButton onClick={() => openEditModal(room)} />
        {room.isActive ? (
          <DeleteButton onClick={() => setDeactivateTarget(room)}>
            Vô hiệu hóa
          </DeleteButton>
        ) : (
          <Button
            size="small"
            type="primary"
            onClick={() => setActivateTarget(room)}
          >
            Kích hoạt lại
          </Button>
        )}
      </TableRowActions>
    )),
  ]);

  return (
    <PageLayout>
      <PageHeader
        title="Quản lý phòng họp"
        extra={
          <Button type="primary" onClick={openCreateModal}>
            Thêm phòng mới
          </Button>
        }
      >
        <SearchForm onReset={resetFilters}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm theo tên, sức chứa, phòng ban…"
          />
          <StatusFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={ROOM_STATUS_OPTIONS}
            allLabel="Tất cả trạng thái"
          />
        </SearchForm>
      </PageHeader>

      <PageContent>
        {error ? (
          <ErrorPage
            description={getApiErrorMessage(
              error,
              "Không tải được danh sách phòng",
            )}
            extra={
              <RetryButton
                onRetry={() => void refetch()}
                loading={isLoading}
              />
            }
          />
        ) : (
          <DataTable
            key={`${search}-${statusFilter}`}
            rowKey="id"
            columns={columns}
            data={filteredRooms}
            loading={isLoading}
            scroll={{ x: true }}
            emptyText={tableEmpty}
            toolbarExtra={
              <RefreshButton
                loading={isLoading}
                onClick={() => void refetch()}
              />
            }
          />
        )}
      </PageContent>

      {editingRoom ? (
        <EditDialog
          title="Sửa phòng"
          open={modalOpen}
          onCancel={closeFormModal}
          onOk={() => form.submit()}
          confirmLoading={submitting}
        >
          {roomForm}
        </EditDialog>
      ) : (
        <CreateDialog
          title="Thêm phòng mới"
          open={modalOpen}
          onCancel={closeFormModal}
          onOk={() => form.submit()}
          confirmLoading={submitting}
        >
          {roomForm}
        </CreateDialog>
      )}

      <DeleteDialog
        open={Boolean(deactivateTarget)}
        title="Vô hiệu hóa phòng này?"
        content="Chỉ được vô hiệu hóa khi phòng không còn lịch chờ duyệt / đã duyệt chưa kết thúc."
        okText="Xác nhận"
        confirmLoading={actionLoading}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
      />

      <ConfirmDialog
        open={Boolean(activateTarget)}
        title="Kích hoạt lại phòng này?"
        content="Phòng sẽ có thể đặt lại sau khi kích hoạt."
        confirmLoading={actionLoading}
        onCancel={() => setActivateTarget(null)}
        onConfirm={handleActivate}
      />
    </PageLayout>
  );
}
