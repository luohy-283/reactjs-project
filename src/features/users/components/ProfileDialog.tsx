import { useEffect, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Alert } from "@/components/ui/feedback/Alert";
import { FormModal } from "@/components/ui/dialog/FormModal";
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

const EMPTY_FORM: ProfileFormValues = {
  fullName: "",
  email: "",
  requestedDepartmentId: null,
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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const fieldErrorStyle = { color: "var(--p-red-500, #ef4444)", display: "block" as const };

export function ProfileDialog({
  open,
  user,
  departments,
  onClose,
  onUpdated,
}: ProfileDialogProps) {
  const toast = useToast();
  const [values, setValues] = useState<ProfileFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    setErrors({});

    void (async () => {
      try {
        const [profile, pendingReq] = await Promise.all([
          getAccount(controller.signal),
          getMyPendingDepartmentChange(controller.signal),
        ]);
        if (controller.signal.aborted) return;

        setAccount(profile);
        setPending(pendingReq);
        setValues({
          fullName: profile.fullName,
          email: profile.email,
          requestedDepartmentId: null,
        });
        // Keep AuthContext / avatar in sync with DB.
        onUpdated(toAuthUser(profile, user.role));
      } catch (err) {
        if (controller.signal.aborted || isAbortError(err)) return;
        setLoadError(getApiErrorMessage(err, "Không tải được thông tin tài khoản"));
        setValues({
          fullName: user.fullName,
          email: user.email,
          requestedDepartmentId: null,
        });
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
    // Intentionally omit onUpdated from deps — open+user gate the fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  const currentDepartment = account?.department ?? user?.department ?? null;
  const currentDepartmentId = currentDepartment?.id;

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!values.fullName.trim()) next.fullName = "Nhập họ tên";
    if (!values.email.trim()) next.email = "Nhập email";
    else if (!isValidEmail(values.email.trim())) next.email = "Email không hợp lệ";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const handleOk = async () => {
    if (!user || loading || loadError) return;
    if (!validate()) return;
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

  const departmentOptions = departments
    .filter((d) => d.id !== currentDepartmentId)
    .map((d) => ({
      value: d.id,
      label: `${d.name} (${d.code})`,
    }));

  return (
    <FormModal
      title="Thông tin tài khoản"
      open={open}
      onCancel={onClose}
      onOk={() => void handleOk()}
      confirmLoading={submitting}
      okText="Lưu"
      cancelText="Đóng"
      okButtonProps={{
        className: loading || Boolean(loadError) ? "p-disabled" : undefined,
      }}
    >
      {loadError ? (
        <Alert type="error" showIcon style={{ marginBottom: 16 }} message={loadError} />
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
        <p style={{ color: "var(--p-text-muted-color, #6b7280)", marginTop: 0 }}>
          Đang tải thông tin tài khoản…
        </p>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 16, opacity: loading ? 0.6 : 1, pointerEvents: loading ? "none" : undefined }}>
        <div>
          <label htmlFor="profile-fullName" style={{ display: "block", marginBottom: 6 }}>
            Họ tên
          </label>
          <InputText
            id="profile-fullName"
            value={values.fullName}
            onChange={(e) => setValues((v) => ({ ...v, fullName: e.target.value }))}
            style={{ width: "100%" }}
          />
          {errors.fullName ? <small style={fieldErrorStyle}>{errors.fullName}</small> : null}
        </div>

        <div>
          <label htmlFor="profile-email" style={{ display: "block", marginBottom: 6 }}>
            Email
          </label>
          <InputText
            id="profile-email"
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            style={{ width: "100%" }}
          />
          {errors.email ? <small style={fieldErrorStyle}>{errors.email}</small> : null}
        </div>

        <div>
          <label htmlFor="profile-current-dept" style={{ display: "block", marginBottom: 6 }}>
            Phòng ban hiện tại
          </label>
          <InputText
            id="profile-current-dept"
            disabled
            value={
              currentDepartment
                ? `${currentDepartment.name} (${currentDepartment.code})`
                : "Chưa gán"
            }
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label htmlFor="profile-req-dept" style={{ display: "block", marginBottom: 6 }}>
            Yêu cầu đổi phòng ban
          </label>
          <Dropdown
            inputId="profile-req-dept"
            value={values.requestedDepartmentId}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                requestedDepartmentId: e.value ?? null,
              }))
            }
            options={departmentOptions}
            optionLabel="label"
            optionValue="value"
            placeholder="Chọn phòng ban mới (tuỳ chọn)"
            showClear
            disabled={Boolean(pending) || loading}
            style={{ width: "100%" }}
          />
          <small style={{ color: "var(--p-text-muted-color, #6b7280)" }}>
            Chỉ đổi phòng ban sau khi admin duyệt.
          </small>
        </div>
      </div>
    </FormModal>
  );
}
