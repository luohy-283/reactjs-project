import { Button } from "antd";

export type UserMenuProps = {
  userName?: string;
  role?: string;
  onLogout: () => void;
  logoutLabel?: string;
};

/** Header user strip — name/role + logout. Auth via props only (no features imports). */
export function UserMenu({
  userName,
  role,
  onLogout,
  logoutLabel = "Đăng xuất",
}: UserMenuProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <span style={{ color: "#fff" }}>
        {userName}
        {role ? ` (${role})` : null}
      </span>
      <Button onClick={onLogout}>{logoutLabel}</Button>
    </div>
  );
}
