import { Checkbox, Dropdown, Button } from "antd";
import type { MenuProps } from "antd";
import { SettingOutlined } from "@ant-design/icons";

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
  const visible = new Set(value);

  const items: MenuProps["items"] = options.map((opt) => ({
    key: opt.key,
    label: (
      <Checkbox
        checked={visible.has(opt.key)}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          const next = new Set(visible);
          if (e.target.checked) next.add(opt.key);
          else next.delete(opt.key);
          onChange([...next]);
        }}
      >
        {opt.label}
      </Checkbox>
    ),
  }));

  return (
    <Dropdown menu={{ items }} trigger={["click"]}>
      <Button icon={<SettingOutlined />}>{buttonText}</Button>
    </Dropdown>
  );
}
