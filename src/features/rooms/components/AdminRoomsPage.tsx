import { useEffect, useState } from "react";
import { Button, Checkbox, Form, Input, InputNumber, Select, Space, Tag } from "antd";
import { ConfirmDialog } from "@/components/ui/dialog/ConfirmDialog";
import { CreateDialog } from "@/components/ui/dialog/CreateDialog";
import { DataTable } from "@/components/ui/table/DataTable";
import { DeleteButton } from "@/components/ui/button/DeleteButton";
import { DeleteDialog } from "@/components/ui/dialog/DeleteDialog";
import { EditButton } from "@/components/ui/button/EditButton";
import { ViewButton } from "@/components/ui/button/ViewButton";
import { EditDialog } from "@/components/ui/dialog/EditDialog";
import { FetchError } from "@/components/ui/error/FetchError";
import { PageContent } from "@/components/ui/page/PageContent";
import { PageHeader } from "@/components/ui/page/PageHeader";
import { PageLayout } from "@/components/ui/page/PageLayout";
import { SearchForm } from "@/components/ui/search/SearchForm";
import { SearchInput } from "@/components/ui/search/SearchInput";
import { StatusBadge } from "@/components/ui/status/StatusBadge";
import { StatusFilter } from "@/components/ui/search/StatusFilter";
import { NoData } from "@/components/ui/empty/NoData";
import { NoSearchResult } from "@/components/ui/empty/NoSearchResult";
import { RefreshButton } from "@/components/ui/toolbar/RefreshButton";
import { TableRowActions } from "@/components/ui/table/TableRowActions";
import { actionsColumn, defineColumns, sortableColumn } from "@/components/ui/table/columnDefs";
import { useAppModal, useToast } from "@/components/ui/feedback/useFeedback";
import { createRoom, updateRoom } from "@/features/rooms/api/rooms.service";
import { useRoomsPage } from "@/features/rooms/api/rooms.hooks";
import type { Room, RoomLayoutType } from "@/features/rooms/api/rooms.types";
import { ROOM_LAYOUT_OPTIONS, VIP_AMENITY_OPTIONS } from "@/features/rooms/api/rooms.types";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatVnd } from "@/lib/money";
import type { Department } from "@/lib/types/department";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useServerTableQuery } from "@/lib/useServerTableQuery";

type RoomActiveFilter = "ACTIVE" | "INACTIVE";
type RoomVipFilter = "VIP" | "STANDARD";

type RoomFormValues = {
  name: string;
  capacity: number;
  lockedDepartmentId?: number | null;
  pricePerHour: number;
  isVip?: boolean;
  vipAmenityList?: string[];
  layoutType?: RoomLayoutType;
  floorWidthM?: number;
  floorDepthM?: number;
};

function amenitiesToCsv(list: string[] | undefined): string | null {
  if (!list || list.length === 0) return null;
  return list.join(",");
}

function csvToAmenities(csv: string | null | undefined): string[] {
  if (!csv?.trim()) return [];
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export type AdminRoomsPageProps = {
  departments: Department[];
  departmentsLoading?: boolean;
  onView3D?: (room: Room) => void;
};

const ROOM_STATUS_OPTIONS = [
  { value: "ACTIVE" as const, label: "Đang hoạt động" },
  { value: "INACTIVE" as const, label: "Ngừng hoạt động" },
];

const ROOM_VIP_OPTIONS = [
  { value: "VIP" as const, label: "VIP" },
  { value: "STANDARD" as const, label: "Thường" },
];

const ROOM_ACTIVE_LABEL: Record<string, string> = {
  true: "Đang hoạt động",
  false: "Ngừng hoạt động",
};

const ROOM_ACTIVE_COLOR: Record<string, string> = {
  true: "green",
  false: "default",
};

export default function AdminRoomsPage({
  departments,
  onView3D,
}: AdminRoomsPageProps) {
  const toast = useToast();
  const appModal = useAppModal();
  const [search, setSearch] = useState("");
  const debouncedQ = useDebouncedValue(search.trim(), 300);
  const [statusFilter, setStatusFilter] = useState<RoomActiveFilter | "ALL">(
    "ALL",
  );
  const [vipFilter, setVipFilter] = useState<RoomVipFilter | "ALL">("ALL");
  const { query, setQuery, pageParams, resetPage } =
    useServerTableQuery();

  useEffect(() => {
    resetPage();
  }, [debouncedQ, resetPage]);

  const q = debouncedQ || undefined;
  const active =
    statusFilter === "ACTIVE"
      ? true
      : statusFilter === "INACTIVE"
        ? false
        : undefined;
  const vip =
    vipFilter === "VIP" ? true : vipFilter === "STANDARD" ? false : undefined;
  const pageOpts = { ...pageParams, q, active, vip };
  const { data: roomsPage, error, isLoading, refetch } = useRoomsPage(pageOpts);
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
    form.setFieldsValue({
      lockedDepartmentId: null,
      pricePerHour: 100000,
      isVip: false,
      vipAmenityList: [],
      layoutType: "STANDARD",
      floorWidthM: 6.5,
      floorDepthM: 5,
    });
    setModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    form.setFieldsValue({
      name: room.name,
      capacity: room.capacity,
      lockedDepartmentId: room.lockedDepartment?.id ?? null,
      pricePerHour: room.pricePerHour,
      isVip: Boolean(room.isVip),
      vipAmenityList: csvToAmenities(room.vipAmenities),
      layoutType: room.layoutType ?? "STANDARD",
      floorWidthM: room.floorWidthM ?? 6.5,
      floorDepthM: room.floorDepthM ?? 5,
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
      const isVip = Boolean(values.isVip);
      const vipAmenities = isVip
        ? amenitiesToCsv(values.vipAmenityList)
        : null;
      if (editingRoom) {
        await updateRoom({
          id: editingRoom.id,
          name: values.name,
          capacity: values.capacity,
          isActive: editingRoom.isActive,
          lockedDepartmentId,
          pricePerHour: values.pricePerHour,
          isVip,
          vipAmenities,
          layoutType: values.layoutType,
          floorWidthM: values.floorWidthM,
          floorDepthM: values.floorDepthM,
        });
        toast.success("Cập nhật phòng thành công");
      } else {
        await createRoom({
          name: values.name,
          capacity: values.capacity,
          lockedDepartmentId,
          pricePerHour: values.pricePerHour,
          isVip,
          vipAmenities,
          layoutType: values.layoutType,
          floorWidthM: values.floorWidthM,
          floorDepthM: values.floorDepthM,
        });
        toast.success("Thêm phòng thành công");
      }
      closeFormModal();
      await refetch();
    } catch (err) {
      toast.error(
        getApiErrorMessage(
          err,
          editingRoom ? "Không cập nhật được phòng" : "Không thêm được phòng",
        ),
      );
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

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setVipFilter("ALL");
    resetPage();
  };

  const hasActiveFilters =
    Boolean(q) || statusFilter !== "ALL" || vipFilter !== "ALL";

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
        label="Kiểu bố cục"
        name="layoutType"
        rules={[{ required: true, message: "Chọn kiểu bố cục" }]}
        tooltip="Độc lập với số chỗ — dùng để mô tả không gian và 3D."
      >
        <Select
          options={ROOM_LAYOUT_OPTIONS.map((o) => ({
            value: o.value,
            label: o.label,
          }))}
          onChange={(value: RoomLayoutType) => {
            const preset = ROOM_LAYOUT_OPTIONS.find((o) => o.value === value);
            if (preset) {
              form.setFieldsValue({
                floorWidthM: preset.defaultWidth,
                floorDepthM: preset.defaultDepth,
              });
            }
          }}
        />
      </Form.Item>

      <Space size={12} style={{ display: "flex", width: "100%" }} align="start">
        <Form.Item
          label="Rộng sàn (m)"
          name="floorWidthM"
          rules={[
            { required: true, message: "Nhập chiều rộng" },
            { type: "number", min: 1, message: "Tối thiểu 1m" },
          ]}
          style={{ flex: 1 }}
        >
          <InputNumber min={1} step={0.5} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          label="Sâu sàn (m)"
          name="floorDepthM"
          rules={[
            { required: true, message: "Nhập chiều sâu" },
            { type: "number", min: 1, message: "Tối thiểu 1m" },
          ]}
          style={{ flex: 1 }}
        >
          <InputNumber min={1} step={0.5} style={{ width: "100%" }} />
        </Form.Item>
      </Space>

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

      <Form.Item name="isVip" valuePropName="checked">
        <Checkbox>Phòng VIP</Checkbox>
      </Form.Item>

      <Form.Item
        noStyle
        shouldUpdate={(prev, next) => prev.isVip !== next.isVip}
      >
        {({ getFieldValue }) =>
          getFieldValue("isVip") ? (
            <Form.Item label="Tiện ích VIP" name="vipAmenityList">
              <Select
                mode="multiple"
                allowClear
                placeholder="Chọn tiện ích"
                options={VIP_AMENITY_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
              />
            </Form.Item>
          ) : null
        }
      </Form.Item>
    </Form>
  );

  const columns = defineColumns<Room>([
    sortableColumn<Room>({
      title: "Tên phòng",
      dataIndex: "name",
      key: "name",
      render: (name: string, room) => (
        <Space size={6}>
          <span>{name}</span>
          {room.isVip ? <Tag color="gold">VIP</Tag> : null}
        </Space>
      ),
    }),
    sortableColumn<Room>({
      title: "Sức chứa",
      dataIndex: "capacity",
      key: "capacity",
    }),
    sortableColumn<Room>({
      title: "Giá / giờ",
      dataIndex: "pricePerHour",
      key: "pricePerHour",
      render: (price: number) => formatVnd(price),
    }),
    {
      title: "Phạm vi",
      key: "lockedDepartment",
      render: (_, room) =>
        room.lockedDepartment
          ? `${room.lockedDepartment.name} (${room.lockedDepartment.code})`
          : "Công khai",
    },
    sortableColumn<Room>({
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
    }),
    actionsColumn<Room>((_, room) => (
      <TableRowActions>
        {onView3D ? (
          <ViewButton onClick={() => onView3D(room)}>Xem 3D</ViewButton>
        ) : null}
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
          <StatusFilter<RoomActiveFilter>
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              resetPage();
            }}
            options={ROOM_STATUS_OPTIONS}
            allLabel="Tất cả trạng thái"
          />
          <StatusFilter<RoomVipFilter>
            value={vipFilter}
            onChange={(value) => {
              setVipFilter(value);
              resetPage();
            }}
            options={ROOM_VIP_OPTIONS}
            allLabel="Tất cả loại phòng"
          />
        </SearchForm>
      </PageHeader>

      <PageContent>
        {error ? (
          <FetchError
            error={error}
            fallback="Không tải được danh sách phòng"
            onRetry={() => void refetch()}
            loading={isLoading}
          />
        ) : (
          <DataTable
            rowKey="id"
            columns={columns}
            data={roomsPage.items}
            loading={isLoading}
            scroll={{ x: true }}
            emptyText={tableEmpty}
            serverSide
            total={roomsPage.totalElements}
            page={query.page}
            pageSize={query.pageSize}
            sort={query.sort}
            onQueryChange={setQuery}
            enableRowSelection
            enableColumnDrag
            enableColumnSetting
            enableMultiSort
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
