import { useRef } from "react";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import type { Menu as MenuType } from "primereact/menu";
import type { MenuItem } from "primereact/menuitem";

export type ColumnSettingOption = {
  key: string;
  label: string;
};

export type ColumnSettingProps = {
  options: ColumnSettingOption[];
  /** Visible column keys. */
  value: string[];
  onChange: (keys: string[]) => void;
  buttonText?: string;
};

/**
 * Minimal show/hide column dropdown. Caller owns visibility state —
 * no persistence. Skip wiring until a screen needs column toggles.
 */
export function ColumnSetting({
  options,
  value,
  onChange,
  buttonText = "Cột",
}: ColumnSettingProps) {
  const menuRef = useRef<MenuType>(null);
  const visible = new Set(value);

  const items: MenuItem[] = options.map((opt) => ({
    template: () => (
      <div
        className="p-menuitem-content"
        style={{ padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: 8 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          inputId={`col-setting-${opt.key}`}
          checked={visible.has(opt.key)}
          onChange={(e) => {
            const next = new Set(visible);
            if (e.checked) next.add(opt.key);
            else next.delete(opt.key);
            onChange([...next]);
          }}
        />
        <label htmlFor={`col-setting-${opt.key}`}>{opt.label}</label>
      </div>
    ),
  }));

  return (
    <>
      <Menu model={items} popup ref={menuRef} />
      <Button
        type="button"
        icon="pi pi-cog"
        label={buttonText}
        outlined
        onClick={(e) => menuRef.current?.toggle(e)}
      />
    </>
  );
}
