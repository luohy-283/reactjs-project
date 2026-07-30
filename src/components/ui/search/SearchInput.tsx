import { Input } from "antd";
import type { InputProps } from "antd";

export type SearchInputProps = Omit<
  InputProps,
  "onChange" | "value" | "allowClear"
> & {
  value: string;
  onChange: (value: string) => void;
  /** Default: 320 */
  width?: number | string;
};

/** Shared list search — controlled text input with clear + search icon. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Tìm kiếm…",
  width = 320,
  style,
  ...inputProps
}: SearchInputProps) {
  return (
    <Input.Search
      allowClear
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onSearch={(next) => onChange(next)}
      style={{ width, maxWidth: "100%", ...style }}
      {...inputProps}
    />
  );
}
