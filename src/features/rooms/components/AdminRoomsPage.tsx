import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog } from "@/components/ui/dialog/ConfirmDialog";
import { CreateDialog } from "@/components/ui/dialog/CreateDialog";
import { DataTable } from "@/components/ui/table/DataTable";
import { DeleteButton } from "@/components/ui/button/DeleteButton";
import { DeleteDialog } from "@/components/ui/dialog/DeleteDialog";
import { EditButton } from "@/components/ui/button/EditButton";
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
import type { Room } from "@/features/rooms/api/rooms.types";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatVnd } from "@/lib/money";
import type { Department } from "@/lib/types/department";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useServerTableQuery } from "@/lib/useServerTableQuery";

type RoomActiveFilter = "ACTIVE" | "INACTIVE";

type RoomFormValues = {
  name: string;
  capacity: number | null;
  lockedDepartmentId: number | null;
  pricePerHour: number | null;
};

const EMPTY_FORM: RoomFormValues = {
  name: "",
  capacity: null,
  lockedDepartmentId: null,
  pricePerHour: 100000,
};

const fieldErrorStyle = { color: "var(--p-red-500, #ef4444)", display: "block" as const };

export type AdminRoomsPageProps = {
  departments: Department[];
  departmentsLoading?: boolean;
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

export default function AdminRoomsPage({
  departments,
}: AdminRoomsPageProps) {
  const toast = useToast();
  const appModal = useAppModal();
  const [search, setSearch] = useState("");
  const debouncedQ = useDebouncedValue(search.trim(), 300);
  const [statusFilter, setStatusFilter] = useState<RoomActiveFilter | "ALL">(
    "ALL",
  );
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
  const pageOpts = { ...pageParams, q, active };
  const { data: roomsPage, error, isLoading, refetch } = useRoomsPage(pageOpts);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Room | null>(null);
  const [activateTarget, setActivateTarget] = useState<Room | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [values, setValues] = useState<RoomFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const openCreateModal = () => {
    setEditingRoom(null);
    setValues({ ...EMPTY_FORM });
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setValues({
      name: room.name,
      capacity: room.capacity,
      lockedDepartmentId: room.lockedDepartment?.id ?? null,
      pricePerHour: room.pricePerHour,
    });
    setErrors({});
    setModalOpen(true);
  };

  const closeFormModal = () => {
    setModalOpen(false);
    setEditingRoom(null);
    setValues({ ...EMPTY_FORM });
    setErrors({});
  };

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!values.name.trim()) next.name = "Vui lòng nhập tên phòng";
    if (values.capacity == null) next.capacity = "Vui lòng nhập sức chứa";
    else if (values.capacity < 1) next.capacity = "Sức chứa phải lớn hơn 0";
    if (values.pricePerHour == null) next.pricePerHour = "Vui lòng nhập giá";
    else if (values.pricePerHour < 0) next.pricePerHour = "Giá không âm";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const lockedDepartmentId = values.lockedDepartmentId ?? null;
      const capacity = values.capacity as number;
      const pricePerHour = values.pricePerHour as number;
      if (editingRoom) {
        await updateRoom({
          id: editingRoom.id,
          name: values.name,
          capacity,
          isActive: editingRoom.isActive,
          lockedDepartmentId,
          pricePerHour,
        });
        toast.success("Cập nhật phòng thành công");
      } else {
        await createRoom({
          name: values.name,
          capacity,
          lockedDepartmentId,
          pricePerHour,
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
    resetPage();
  };

  const hasActiveFilters = Boolean(q) || statusFilter !== "ALL";

  const tableEmpty = hasActiveFilters ? (
    <NoSearchResult onReset={resetFilters} />
  ) : (
    <NoData description="Chưa có phòng họp" />
  );

  const departmentOptions = [
    { value: null as number | null, label: "Công khai (mọi phòng ban)" },
    ...departments.map((d) => ({
      value: d.id as number | null,
      label: `${d.name} (${d.code})`,
    })),
  ];

  const roomForm = (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label htmlFor="room-name" style={{ display: "block", marginBottom: 6 }}>
          Tên phòng
        </label>
        <InputText
          id="room-name"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          placeholder="VD: Phòng Coda"
          style={{ width: "100%" }}
        />
        {errors.name ? <small style={fieldErrorStyle}>{errors.name}</small> : null}
      </div>

      <div>
        <label htmlFor="room-capacity" style={{ display: "block", marginBottom: 6 }}>
          Sức chứa
        </label>
        <InputNumber
          inputId="room-capacity"
          value={values.capacity}
          onValueChange={(e) =>
            setValues((v) => ({ ...v, capacity: e.value ?? null }))
          }
          min={1}
          style={{ width: "100%" }}
          inputStyle={{ width: "100%" }}
        />
        {errors.capacity ? (
          <small style={fieldErrorStyle}>{errors.capacity}</small>
        ) : null}
      </div>

      <div>
        <label htmlFor="room-price" style={{ display: "block", marginBottom: 6 }}>
          Giá thuê / giờ (VND)
        </label>
        <InputNumber
          inputId="room-price"
          value={values.pricePerHour}
          onValueChange={(e) =>
            setValues((v) => ({ ...v, pricePerHour: e.value ?? null }))
          }
          min={0}
          step={10000}
          style={{ width: "100%" }}
          inputStyle={{ width: "100%" }}
        />
        {errors.pricePerHour ? (
          <small style={fieldErrorStyle}>{errors.pricePerHour}</small>
        ) : null}
      </div>

      <div>
        <label htmlFor="room-dept" style={{ display: "block", marginBottom: 6 }}>
          Khóa theo phòng ban
        </label>
        <Dropdown
          inputId="room-dept"
          value={values.lockedDepartmentId}
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              lockedDepartmentId: e.value ?? null,
            }))
          }
          options={departmentOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Công khai (mọi phòng ban)"
          style={{ width: "100%" }}
        />
        <small style={{ color: "var(--p-text-muted-color, #6b7280)" }}>
          Công khai: mọi đơn vị đều thấy. Chọn 1 phòng ban: chỉ đơn vị đó (và
          admin) thấy/đặt.
        </small>
      </div>
    </div>
  );

  const columns = defineColumns<Room>([
    sortableColumn<Room>({ title: "Tên phòng", dataIndex: "name", key: "name" }),
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
        <EditButton onClick={() => openEditModal(room)} />
        {room.isActive ? (
          <DeleteButton onClick={() => setDeactivateTarget(room)}>
            Vô hiệu hóa
          </DeleteButton>
        ) : (
          <Button
            size="small"
            label="Kích hoạt lại"
            onClick={() => setActivateTarget(room)}
          />
        )}
      </TableRowActions>
    )),
  ]);

  return (
    <PageLayout>
      <PageHeader
        title="Quản lý phòng họp"
        extra={
          <Button label="Thêm phòng mới" onClick={openCreateModal} />
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
          onOk={() => void handleSubmit()}
          confirmLoading={submitting}
        >
          {roomForm}
        </EditDialog>
      ) : (
        <CreateDialog
          title="Thêm phòng mới"
          open={modalOpen}
          onCancel={closeFormModal}
          onOk={() => void handleSubmit()}
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
