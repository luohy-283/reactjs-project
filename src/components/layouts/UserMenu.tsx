import { Avatar, Button, Dropdown, theme } from "antd";
import type { MenuProps } from "antd";
import { UserOutlined } from "@ant-design/icons";

export type UserMenuProps = {
  userName?: string;
  role?: string;
  departmentName?: string;
  onLogout: () => void;
  onOpenProfile?: () => void;
  onOpenInvoices?: () => void;
  logoutLabel?: string;
};

/** Header user strip — avatar dropdown. Auth via props only (no features imports). */
export function UserMenu({
  userName,
  role,
  departmentName,
  onLogout,
  onOpenProfile,
  onOpenInvoices,
  logoutLabel = "Đăng xuất",
}: UserMenuProps) {
  const { token } = theme.useToken();
  const items: MenuProps["items"] = [
    {
      key: "info",
      label: (
        <div style={{ maxWidth: 220 }}>
          <div style={{ fontWeight: 600 }}>{userName}</div>
          {role ? <div style={{ fontSize: 12, opacity: 0.75 }}>{role}</div> : null}
          {departmentName ? (
            <div style={{ fontSize: 12, opacity: 0.75 }}>{departmentName}</div>
          ) : null}
        </div>
      ),
      disabled: true,
    },
    { type: "divider" },
    ...(onOpenProfile
      ? [{ key: "profile", label: "Thông tin cá nhân", onClick: onOpenProfile }]
      : []),
    ...(onOpenInvoices
      ? [{ key: "invoices", label: "Hóa đơn của tôi", onClick: onOpenInvoices }]
      : []),
    { key: "logout", label: logoutLabel, onClick: onLogout },
  ];

  return (
    <Dropdown menu={{ items }} placement="bottomRight" trigger={["click"]}>
      <Button
        type="text"
        style={{
          color: token.colorText,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Avatar size="small" icon={<UserOutlined />} />
        <span>{userName}</span>
      </Button>
    </Dropdown>
  );
}
