import { Select } from "antd";

export type StatusFilterOption<T extends string> = {
  value: T;
  label: string;
};

export type StatusFilterProps<T extends string> = {
  value: T | "ALL";
  onChange: (value: T | "ALL") => void;
  options: StatusFilterOption<T>[];
  allLabel?: string;
  placeholder?: string;
  width?: number | string;
  allowClear?: boolean;
};

/** Shared status select — `ALL` = no status filter. */
export function StatusFilter<T extends string>({
  value,
  onChange,
  options,
  allLabel = "Tất cả",
  placeholder = "Trạng thái",
  width = 180,
  allowClear = false,
}: StatusFilterProps<T>) {
  return (
    <Select
      value={value}
      placeholder={placeholder}
      allowClear={allowClear}
      style={{ width, minWidth: 140 }}
      options={[
        { value: "ALL", label: allLabel },
        ...options.map((opt) => ({ value: opt.value, label: opt.label })),
      ]}
      onChange={(next) => onChange((next ?? "ALL") as T | "ALL")}
    />
  );
}
