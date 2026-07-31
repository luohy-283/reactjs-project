import { Input } from "antd";
import type { InputProps } from "antd";

export type SearchInputProps = Omit<
  InputProps,
  "onChange" | "value" | "allowClear"
> & {
  value: string;
  onChange: (value: string) => void;
  /**
   * Explicit width. When omitted, grows in the filter row
   * (flex 1, min 280px, max 640px) so long placeholders stay visible.
   */
  width?: number | string;
};

/** Shared list search — controlled text input with clear + search icon. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Tìm kiếm…",
  width,
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
      style={{
        flex: width == null ? "1 1 420px" : undefined,
        width: width ?? "100%",
        minWidth: 280,
        maxWidth: width ?? 450,
        ...style,
      }}
      {...inputProps}
    />
  );
}
