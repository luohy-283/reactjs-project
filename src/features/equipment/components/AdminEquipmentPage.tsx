import { useEffect, useState } from "react";
import { Button, Form, Input, InputNumber, Select, Typography } from "antd";
import { CreateDialog } from "@/components/ui/dialog/CreateDialog";
import { EditDialog } from "@/components/ui/dialog/EditDialog";
import { DataTable } from "@/components/ui/table/DataTable";
import { EditButton } from "@/components/ui/button/EditButton";
import { FetchError } from "@/components/ui/error/FetchError";
import { NoData } from "@/components/ui/empty/NoData";
import { NoSearchResult } from "@/components/ui/empty/NoSearchResult";
import { PageContent } from "@/components/ui/page/PageContent";
import { PageHeader } from "@/components/ui/page/PageHeader";
import { PageLayout } from "@/components/ui/page/PageLayout";
import { RefreshButton } from "@/components/ui/toolbar/RefreshButton";
import { SearchForm } from "@/components/ui/search/SearchForm";
import { SearchInput } from "@/components/ui/search/SearchInput";
import { StatusBadge } from "@/components/ui/status/StatusBadge";
import { StatusFilter } from "@/components/ui/search/StatusFilter";
import { TableRowActions } from "@/components/ui/table/TableRowActions";
import { ApproveRejectActions } from "@/components/ui/table/ApproveRejectActions";
import { TabBar } from "@/components/ui/tabs/TabBar";
import { defineTabItems } from "@/components/ui/tabs/TabItem";
import {
  actionsColumn,
  defineColumns,
  sortableColumn,
} from "@/components/ui/table/columnDefs";
import { useToast } from "@/components/ui/feedback/useFeedback";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  useEquipmentForSelect,
  useEquipmentPage,
  useEquipmentPurchasesPage,
  useRoomsForSelect,
} from "@/features/equipment/api/equipment.hooks";
import {
  approveEquipmentPurchase,
  createEquipment,
  createEquipmentPurchase,
  fulfillEquipmentPurchase,
  rejectEquipmentPurchase,
  updateEquipment,
} from "@/features/equipment/api/equipment.service";
import type {
  Equipment,
  EquipmentCategory,
  EquipmentPurchase,
  PurchaseStatus,
} from "@/features/equipment/api/equipment.types";
import {
  EQUIPMENT_CATEGORIES,
  PURCHASE_STATUS_OPTIONS,
} from "@/features/equipment/api/equipment.types";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatVnd } from "@/lib/money";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useServerTableQuery } from "@/lib/useServerTableQuery";
import { useUrlTab } from "@/lib/useUrlTab";

type EquipmentTab = "catalog" | "purchases";

type EquipmentFormValues = {
  name: string;
  category: EquipmentCategory;
  unitCost: number;
};

type PurchaseFormValues = {
  roomId: number;
  equipmentId: number;
  quantity: number;
  reason?: string;
};

function parseEquipmentTab(raw: string | null): EquipmentTab {
  return raw === "purchases" ? "purchases" : "catalog";
}

const CATEGORY_LABEL: Record<EquipmentCategory, string> = {
  PROJECTOR: "Máy chiếu",
  DISPLAY: "Màn hình",
  AUDIO: "Âm thanh",
  VC: "Họp trực tuyến",
  MICROPHONE: "Micro không dây",
  OTHER: "Khác",
};

const PURCHASE_STATUS_LABEL: Record<PurchaseStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  FULFILLED: "Đã nhận",
};

const PURCHASE_STATUS_COLOR: Record<string, string> = {
  PENDING: "gold",
  APPROVED: "green",
  REJECTED: "default",
  FULFILLED: "blue",
};

export default function AdminEquipmentPage() {
  const toast = useToast();
  const { user } = useAuth();
  const canApprove =
    user?.role === "ADMIN" || user?.role === "MANAGER";

  const { tab, setTab } = useUrlTab({
    defaultTab: "catalog",
    parse: parseEquipmentTab,
  });
  const { query, setQuery, pageParams, resetPage, resetQuery } =
    useServerTableQuery();

  const [catalogSearch, setCatalogSearch] = useState("");
  const debouncedCatalogQ = useDebouncedValue(catalogSearch.trim(), 300);
  const [purchaseStatus, setPurchaseStatus] = useState<
    PurchaseStatus | "ALL"
  >("ALL");

  useEffect(() => {
    resetPage();
  }, [debouncedCatalogQ, purchaseStatus, resetPage]);

  const catalogOpts = {
    ...pageParams,
    ...(debouncedCatalogQ ? { q: debouncedCatalogQ } : {}),
  };
  const purchaseOpts = {
    ...pageParams,
    ...(purchaseStatus !== "ALL" ? { status: purchaseStatus } : {}),
  };

  const {
    data: equipmentPage,
    error: catalogError,
    isLoading: catalogLoading,
    refetch: refetchCatalog,
  } = useEquipmentPage(catalogOpts, tab === "catalog");

  const {
    data: purchasePage,
    error: purchaseError,
    isLoading: purchaseLoading,
    refetch: refetchPurchases,
  } = useEquipmentPurchasesPage(purchaseOpts, tab === "purchases");

  const { data: rooms, isLoading: roomsLoading } = useRoomsForSelect(true);
  const {
    data: equipmentSelect,
    isLoading: equipmentSelectLoading,
    refetch: refetchEquipmentSelect,
  } = useEquipmentForSelect(true);

  const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);
  const [equipmentForm] = Form.useForm<EquipmentFormValues>();
  const [purchaseForm] = Form.useForm<PurchaseFormValues>();
  const selectedEquipmentId = Form.useWatch("equipmentId", purchaseForm);
  const catalogUnitCost = equipmentSelect.find(
    (e) => e.id === selectedEquipmentId,
  )?.unitCost;

  const openCreateEquipment = () => {
    setEditing(null);
    equipmentForm.resetFields();
    equipmentForm.setFieldsValue({
      category: "PROJECTOR",
      unitCost: 0,
    });
    setEquipmentModalOpen(true);
  };

  const openEditEquipment = (row: Equipment) => {
    setEditing(row);
    equipmentForm.setFieldsValue({
      name: row.name,
      category: row.category,
      unitCost: row.unitCost,
    });
    setEquipmentModalOpen(true);
  };

  const closeEquipmentModal = () => {
    setEquipmentModalOpen(false);
    setEditing(null);
    equipmentForm.resetFields();
  };

  const handleEquipmentSubmit = async (values: EquipmentFormValues) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateEquipment({
          id: editing.id,
          name: values.name,
          category: values.category,
          unitCost: values.unitCost,
          isActive: editing.isActive,
        });
        toast.success("Cập nhật thiết bị thành công");
      } else {
        await createEquipment({
          name: values.name,
          category: values.category,
          unitCost: values.unitCost,
        });
        toast.success("Thêm thiết bị thành công");
      }
      closeEquipmentModal();
      await Promise.all([refetchCatalog(), refetchEquipmentSelect()]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Thao tác thất bại"));
    } finally {
      setSubmitting(false);
    }
  };

  const openCreatePurchase = () => {
    purchaseForm.resetFields();
    purchaseForm.setFieldsValue({ quantity: 1 });
    setPurchaseModalOpen(true);
  };

  const closePurchaseModal = () => {
    setPurchaseModalOpen(false);
    purchaseForm.resetFields();
  };

  const handlePurchaseSubmit = async (values: PurchaseFormValues) => {
    setSubmitting(true);
    try {
      await createEquipmentPurchase({
        roomId: values.roomId,
        equipmentId: values.equipmentId,
        quantity: values.quantity,
        reason: values.reason,
      });
      toast.success("Tạo phiếu mua thành công");
      closePurchaseModal();
      if (tab === "purchases") {
        await refetchPurchases();
      } else {
        setTab("purchases");
        resetQuery();
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không tạo được phiếu mua"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (row: EquipmentPurchase) => {
    setActingId(row.id);
    try {
      await approveEquipmentPurchase(row.id);
      toast.success("Đã duyệt phiếu mua");
      await refetchPurchases();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Duyệt thất bại"));
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (row: EquipmentPurchase) => {
    setActingId(row.id);
    try {
      await rejectEquipmentPurchase(row.id);
      toast.success("Đã từ chối phiếu mua");
      await refetchPurchases();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Từ chối thất bại"));
    } finally {
      setActingId(null);
    }
  };

  const handleFulfill = async (row: EquipmentPurchase) => {
    setActingId(row.id);
    try {
      await fulfillEquipmentPurchase(row.id);
      toast.success("Đã nhận hàng");
      await refetchPurchases();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Nhận hàng thất bại"));
    } finally {
      setActingId(null);
    }
  };

  const resetCatalogFilters = () => {
    setCatalogSearch("");
    resetPage();
  };

  const resetPurchaseFilters = () => {
    setPurchaseStatus("ALL");
    resetPage();
  };

  const catalogHasFilters = Boolean(debouncedCatalogQ);
  const purchaseHasFilters = purchaseStatus !== "ALL";

  const catalogColumns = defineColumns<Equipment>([
    sortableColumn<Equipment>({
      title: "Tên thiết bị",
      dataIndex: "name",
      key: "name",
    }),
    sortableColumn<Equipment>({
      title: "Loại",
      dataIndex: "category",
      key: "category",
      render: (c: EquipmentCategory) => CATEGORY_LABEL[c] ?? c,
    }),
    sortableColumn<Equipment>({
      title: "Đơn giá",
      dataIndex: "unitCost",
      key: "unitCost",
      render: (v: number) => formatVnd(v),
    }),
    {
      title: "Trạng thái",
      key: "isActive",
      render: (_, row) => (
        <StatusBadge
          status={row.isActive}
          colorMap={{ true: "green", false: "default" }}
          labelMap={{ true: "Hoạt động", false: "Ngừng" }}
        />
      ),
    },
    actionsColumn<Equipment>((_, row) => (
      <TableRowActions>
        <EditButton onClick={() => openEditEquipment(row)} />
      </TableRowActions>
    )),
  ]);

  const purchaseColumns = defineColumns<EquipmentPurchase>([
    {
      title: "Phòng",
      key: "roomName",
      render: (_, row) => row.roomName ?? `#${row.roomId}`,
    },
    {
      title: "Thiết bị",
      key: "equipmentName",
      render: (_, row) => row.equipmentName ?? `#${row.equipmentId}`,
    },
    sortableColumn<EquipmentPurchase>({
      title: "SL",
      dataIndex: "quantity",
      key: "quantity",
    }),
    sortableColumn<EquipmentPurchase>({
      title: "Đơn giá",
      dataIndex: "unitCost",
      key: "unitCost",
      render: (v: number) => formatVnd(v),
    }),
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
      render: (v: string | null | undefined) => v || "—",
    },
    {
      title: "Người yêu cầu",
      key: "requestedBy",
      render: (_, row) => row.requestedByLogin ?? "—",
    },
    sortableColumn<EquipmentPurchase>({
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (s: PurchaseStatus) => (
        <StatusBadge
          status={s}
          colorMap={PURCHASE_STATUS_COLOR}
          labelMap={PURCHASE_STATUS_LABEL}
        />
      ),
    }),
    actionsColumn<EquipmentPurchase>((_, row) => {
      if (row.status === "PENDING" && canApprove) {
        return (
          <ApproveRejectActions
            loading={actingId === row.id}
            onApprove={() => void handleApprove(row)}
            onReject={() => void handleReject(row)}
            approveConfirm={{ title: "Duyệt phiếu mua này?" }}
            rejectConfirm={{ title: "Từ chối phiếu mua này?" }}
          />
        );
      }
      if (row.status === "APPROVED") {
        return (
          <TableRowActions>
            <Button
              type="primary"
              size="small"
              loading={actingId === row.id}
              onClick={() => void handleFulfill(row)}
            >
              Nhận hàng
            </Button>
          </TableRowActions>
        );
      }
      return null;
    }),
  ]);

  const tabItems = defineTabItems([
    { key: "catalog", label: "Catalog" },
    { key: "purchases", label: "Phiếu mua" },
  ]);

  const onTabChange = (key: string) => {
    setTab(key);
    resetQuery();
  };

  const pageError = tab === "catalog" ? catalogError : purchaseError;
  const pageLoading = tab === "catalog" ? catalogLoading : purchaseLoading;
  const refetchActive =
    tab === "catalog" ? refetchCatalog : refetchPurchases;

  const equipmentFormNode = (
    <Form
      form={equipmentForm}
      layout="vertical"
      onFinish={handleEquipmentSubmit}
    >
      <Form.Item
        label="Tên thiết bị"
        name="name"
        rules={[{ required: true, message: "Nhập tên thiết bị" }]}
      >
        <Input placeholder="VD: Máy chiếu Epson" />
      </Form.Item>
      <Form.Item
        label="Loại"
        name="category"
        rules={[{ required: true, message: "Chọn loại" }]}
      >
        <Select options={EQUIPMENT_CATEGORIES} />
      </Form.Item>
      <Form.Item
        label="Đơn giá (VND)"
        name="unitCost"
        rules={[
          { required: true, message: "Nhập đơn giá" },
          { type: "number", min: 0, message: "Giá không âm" },
        ]}
      >
        <InputNumber min={0} step={10000} style={{ width: "100%" }} />
      </Form.Item>
    </Form>
  );

  const equipmentOptions = equipmentSelect.map((e) => ({
    value: e.id,
    label: `${e.name} (${formatVnd(e.unitCost)})`,
  }));

  return (
    <PageLayout>
      <PageHeader
        title="Quản lý thiết bị"
        extra={
          tab === "catalog" ? (
            <Button type="primary" onClick={openCreateEquipment}>
              Thêm thiết bị
            </Button>
          ) : (
            <Button type="primary" onClick={openCreatePurchase}>
              Tạo phiếu mua
            </Button>
          )
        }
      />

      <PageContent>
        <TabBar
          activeKey={tab}
          onChange={onTabChange}
          items={tabItems}
          style={{ marginBottom: 16 }}
        />

        {pageError ? (
          <FetchError
            error={pageError}
            fallback={
              tab === "catalog"
                ? "Không tải được danh mục thiết bị"
                : "Không tải được phiếu mua"
            }
            onRetry={() => void refetchActive()}
            loading={pageLoading}
          />
        ) : tab === "catalog" ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <SearchForm onReset={resetCatalogFilters}>
                <SearchInput
                  value={catalogSearch}
                  onChange={setCatalogSearch}
                  placeholder="Tìm theo tên thiết bị…"
                />
              </SearchForm>
            </div>
            <DataTable
              key="catalog"
              rowKey="id"
              columns={catalogColumns}
              data={equipmentPage.items}
              loading={catalogLoading}
              scroll={{ x: true }}
              emptyText={
                catalogHasFilters ? (
                  <NoSearchResult onReset={resetCatalogFilters} />
                ) : (
                  <NoData description="Chưa có thiết bị trong catalog" />
                )
              }
              serverSide
              total={equipmentPage.totalElements}
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
                  loading={catalogLoading}
                  onClick={() => void refetchCatalog()}
                />
              }
            />
          </>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <SearchForm onReset={resetPurchaseFilters}>
                <StatusFilter<PurchaseStatus>
                  value={purchaseStatus}
                  onChange={(value) => {
                    setPurchaseStatus(value);
                    resetPage();
                  }}
                  options={PURCHASE_STATUS_OPTIONS}
                  allLabel="Tất cả trạng thái"
                />
              </SearchForm>
            </div>
            <DataTable
              key="purchases"
              rowKey="id"
              columns={purchaseColumns}
              data={purchasePage.items}
              loading={purchaseLoading}
              scroll={{ x: true }}
              emptyText={
                purchaseHasFilters ? (
                  <NoSearchResult onReset={resetPurchaseFilters} />
                ) : (
                  <NoData description="Chưa có phiếu mua" />
                )
              }
              serverSide
              total={purchasePage.totalElements}
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
                  loading={purchaseLoading}
                  onClick={() => void refetchPurchases()}
                />
              }
            />
          </>
        )}
      </PageContent>

      {editing ? (
        <EditDialog
          title="Sửa thiết bị"
          open={equipmentModalOpen}
          onCancel={closeEquipmentModal}
          onOk={() => equipmentForm.submit()}
          confirmLoading={submitting}
        >
          {equipmentFormNode}
        </EditDialog>
      ) : (
        <CreateDialog
          title="Thêm thiết bị"
          open={equipmentModalOpen}
          onCancel={closeEquipmentModal}
          onOk={() => equipmentForm.submit()}
          confirmLoading={submitting}
        >
          {equipmentFormNode}
        </CreateDialog>
      )}

      <CreateDialog
        title="Tạo phiếu mua"
        open={purchaseModalOpen}
        onCancel={closePurchaseModal}
        onOk={() => purchaseForm.submit()}
        confirmLoading={submitting}
      >
        <Form
          form={purchaseForm}
          layout="vertical"
          onFinish={handlePurchaseSubmit}
        >
          <Form.Item
            label="Phòng"
            name="roomId"
            rules={[{ required: true, message: "Chọn phòng" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              loading={roomsLoading}
              placeholder="Chọn phòng"
              options={rooms.map((r) => ({
                value: r.id,
                label: r.name,
              }))}
            />
          </Form.Item>
          <Form.Item
            label="Thiết bị"
            name="equipmentId"
            rules={[{ required: true, message: "Chọn thiết bị" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              loading={equipmentSelectLoading}
              placeholder="Chọn từ catalog"
              options={equipmentOptions}
              notFoundContent={
                !equipmentSelectLoading && equipmentOptions.length === 0
                  ? "Chưa có thiết bị trong catalog"
                  : undefined
              }
            />
          </Form.Item>
          <Form.Item
            label="Số lượng"
            name="quantity"
            rules={[
              { required: true, message: "Nhập số lượng" },
              { type: "number", min: 1, message: "Tối thiểu 1" },
            ]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Đơn giá (từ catalog)">
            <Typography.Text type={selectedEquipmentId ? undefined : "secondary"}>
              {selectedEquipmentId != null
                ? formatVnd(catalogUnitCost ?? 0)
                : "Chọn thiết bị để xem đơn giá"}
            </Typography.Text>
          </Form.Item>
          <Form.Item label="Lý do" name="reason">
            <Input.TextArea rows={2} maxLength={500} />
          </Form.Item>
        </Form>
      </CreateDialog>
    </PageLayout>
  );
}
