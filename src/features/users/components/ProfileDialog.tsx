import { useEffect, useState } from "react";
import { Alert, Form, Input, Modal, Select, Typography } from "antd";
import { useDepartments } from "@/features/departments/api/departments.hooks";
import type { DepartmentSummary, User } from "@/features/auth/api/auth.types";
import {
  getMyPendingDepartmentChange,
  requestDepartmentChange,
  updateAccount,
} from "@/features/users/api/users.service";
import type { DepartmentChangeRequest } from "@/features/users/api/users.types";
import { getApiErrorMessage, isAbortError } from "@/lib/api-error";
import { useToast } from "@/components/ui/feedback/useFeedback";

type ProfileFormValues = {
  fullName: string;
  email: string;
  requestedDepartmentId?: number | null;
};

export type ProfileDialogProps = {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onUpdated: (next: User) => void;
};

export function ProfileDialog({
  open,
  user,
  onClose,
  onUpdated,
}: ProfileDialogProps) {
  const toast = useToast();
  const { data: departments } = useDepartments(open);
  const [form] = Form.useForm<ProfileFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState<DepartmentChangeRequest | null>(null);
  const [loadingPending, setLoadingPending] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    form.setFieldsValue({
      fullName: user.fullName,
      email: user.email,
      requestedDepartmentId: undefined,
    });

    const controller = new AbortController();
    setLoadingPending(true);
    void getMyPendingDepartmentChange(controller.signal)
      .then((req) => {
        if (!controller.signal.aborted) setPending(req);
      })
      .catch((err) => {
        if (!controller.signal.aborted && !isAbortError(err)) {
          setPending(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingPending(false);
      });

    return () => controller.abort();
  }, [open, user, form]);

  const handleOk = async () => {
    if (!user) return;
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const updated = await updateAccount({
        fullName: values.fullName,
        email: values.email,
      });
      const department: DepartmentSummary | null | undefined =
        updated.department ?? user.department;

      if (
        values.requestedDepartmentId != null &&
        values.requestedDepartmentId !== user.department?.id &&
        !pending
      ) {
        const req = await requestDepartmentChange(values.requestedDepartmentId);
        setPending(req);
        toast.success("Đã gửi yêu cầu đổi phòng ban — chờ admin duyệt");
      } else {
        toast.success("Cập nhật thông tin thành công");
      }

      onUpdated({
        id: updated.id,
        email: updated.email,
        fullName: updated.fullName,
        role: user.role,
        department: department ?? null,
      });
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Cập nhật thất bại"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Thông tin tài khoản"
      open={open}
      onCancel={onClose}
      onOk={() => void handleOk()}
      confirmLoading={submitting}
      okText="Lưu"
      cancelText="Đóng"
      destroyOnHidden
    >
      {pending ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Đang chờ duyệt đổi sang: ${pending.requestedDepartment.name}`}
        />
      ) : null}
      {loadingPending ? (
        <Typography.Paragraph type="secondary">
          Đang tải…
        </Typography.Paragraph>
      ) : null}
      <Form form={form} layout="vertical">
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
        <Form.Item label="Phòng ban hiện tại">
          <Input
            disabled
            value={
              user?.department
                ? `${user.department.name} (${user.department.code})`
                : "Chưa gán"
            }
          />
        </Form.Item>
        <Form.Item
          label="Yêu cầu đổi phòng ban"
          name="requestedDepartmentId"
          extra="Chỉ đổi phòng ban sau khi admin duyệt."
        >
          <Select
            allowClear
            disabled={Boolean(pending)}
            placeholder="Chọn phòng ban mới (tuỳ chọn)"
            options={departments
              .filter((d) => d.id !== user?.department?.id)
              .map((d) => ({
                value: d.id,
                label: `${d.name} (${d.code})`,
              }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
