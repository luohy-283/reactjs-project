import { useEffect, useState } from "react";
import { Alert, Form, Input, Modal, Select, Typography } from "antd";
import {
  getAccount,
  getMyPendingDepartmentChange,
  requestDepartmentChange,
  updateAccount,
} from "@/features/users/api/users.service";
import type {
  AccountProfile,
  DepartmentChangeRequest,
} from "@/features/users/api/users.types";
import { getApiErrorMessage, isAbortError } from "@/lib/api-error";
import type { Department } from "@/lib/types/department";
import type { User, UserRole } from "@/lib/types/user";
import { useToast } from "@/components/ui/feedback/useFeedback";

type ProfileFormValues = {
  fullName: string;
  email: string;
  requestedDepartmentId?: number | null;
};

export type ProfileDialogProps = {
  open: boolean;
  user: User | null;
  departments: Department[];
  onClose: () => void;
  onUpdated: (next: User) => void;
};

function roleFromAuthorities(authorities: string[] | undefined): UserRole {
  if (authorities?.some((a) => a === "ROLE_ADMIN" || a === "ADMIN")) {
    return "ADMIN";
  }
  return "USER";
}

function toAuthUser(profile: AccountProfile, fallbackRole?: UserRole): User {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    role: roleFromAuthorities(profile.authorities) || fallbackRole || "USER",
    department: profile.department ?? null,
  };
}

export function ProfileDialog({
  open,
  user,
  departments,
  onClose,
  onUpdated,
}: ProfileDialogProps) {
  const toast = useToast();
  const [form] = Form.useForm<ProfileFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState<DepartmentChangeRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  /** Fresh account from GET /api/account — source of truth while dialog is open. */
  const [account, setAccount] = useState<AccountProfile | null>(null);

  useEffect(() => {
    if (!open || !user) return;

    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    setPending(null);
    setAccount(null);

    void (async () => {
      try {
        const [profile, pendingReq] = await Promise.all([
          getAccount(controller.signal),
          getMyPendingDepartmentChange(controller.signal),
        ]);
        if (controller.signal.aborted) return;

        setAccount(profile);
        setPending(pendingReq);
        form.setFieldsValue({
          fullName: profile.fullName,
          email: profile.email,
          requestedDepartmentId: undefined,
        });
        // Keep AuthContext / avatar in sync with DB.
        onUpdated(toAuthUser(profile, user.role));
      } catch (err) {
        if (controller.signal.aborted || isAbortError(err)) return;
        setLoadError(getApiErrorMessage(err, "Không tải được thông tin tài khoản"));
        form.setFieldsValue({
          fullName: user.fullName,
          email: user.email,
          requestedDepartmentId: undefined,
        });
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
    // Intentionally omit onUpdated/form from deps — open+user gate the fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  const currentDepartment = account?.department ?? user?.department ?? null;
  const currentDepartmentId = currentDepartment?.id;

  const handleOk = async () => {
    if (!user) return;
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const updated = await updateAccount({
        fullName: values.fullName,
        email: values.email,
      });
      const department = updated.department ?? currentDepartment;

      if (
        values.requestedDepartmentId != null &&
        values.requestedDepartmentId !== currentDepartmentId &&
        !pending
      ) {
        const req = await requestDepartmentChange(values.requestedDepartmentId);
        setPending(req);
        toast.success("Đã gửi yêu cầu đổi phòng ban — chờ admin duyệt");
      } else {
        toast.success("Cập nhật thông tin thành công");
      }

      const nextUser = toAuthUser(
        { ...updated, department: department ?? null },
        user.role,
      );
      setAccount({
        ...updated,
        department: department ?? null,
      });
      onUpdated(nextUser);
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
      okButtonProps={{ disabled: loading || Boolean(loadError) }}
      destroyOnHidden
    >
      {loadError ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={loadError}
        />
      ) : null}
      {pending ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Đang chờ duyệt đổi sang: ${pending.requestedDepartment.name}`}
        />
      ) : null}
      {loading ? (
        <Typography.Paragraph type="secondary">
          Đang tải thông tin tài khoản…
        </Typography.Paragraph>
      ) : null}
      <Form form={form} layout="vertical" disabled={loading}>
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
              currentDepartment
                ? `${currentDepartment.name} (${currentDepartment.code})`
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
            disabled={Boolean(pending) || loading}
            placeholder="Chọn phòng ban mới (tuỳ chọn)"
            options={departments
              .filter((d) => d.id !== currentDepartmentId)
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
