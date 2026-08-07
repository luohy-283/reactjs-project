import { useRef } from "react";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import type { Menu as MenuType } from "primereact/menu";
import type { MenuItem } from "primereact/menuitem";

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
  const menuRef = useRef<MenuType>(null);

  const items: MenuItem[] = [
    {
      template: () => (
        <div style={{ padding: "0.75rem 1rem", maxWidth: 220 }}>
          <div style={{ fontWeight: 600 }}>{userName}</div>
          {role ? <div style={{ fontSize: 12, opacity: 0.75 }}>{role}</div> : null}
          {departmentName ? (
            <div style={{ fontSize: 12, opacity: 0.75 }}>{departmentName}</div>
          ) : null}
        </div>
      ),
    },
    { separator: true },
    ...(onOpenProfile
      ? [
          {
            label: "Thông tin cá nhân",
            icon: "pi pi-user",
            command: () => onOpenProfile(),
          } satisfies MenuItem,
        ]
      : []),
    ...(onOpenInvoices
      ? [
          {
            label: "Hóa đơn của tôi",
            icon: "pi pi-file",
            command: () => onOpenInvoices(),
          } satisfies MenuItem,
        ]
      : []),
    {
      label: logoutLabel,
      icon: "pi pi-sign-out",
      command: () => onLogout(),
    },
  ];

  return (
    <>
      <Menu model={items} popup ref={menuRef} popupAlignment="right" />
      <Button
        type="button"
        text
        onClick={(e) => menuRef.current?.toggle(e)}
        style={{
          color: "#fff",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Avatar icon="pi pi-user" shape="circle" size="normal" />
        <span>{userName}</span>
        <i className="pi pi-angle-down" />
      </Button>
    </>
  );
}
