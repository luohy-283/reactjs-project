import { Dropdown } from "primereact/dropdown";

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
  const items = [
    { value: "ALL" as const, label: allLabel },
    ...options.map((opt) => ({ value: opt.value, label: opt.label })),
  ];

  return (
    <Dropdown
      value={value}
      options={items}
      optionLabel="label"
      optionValue="value"
      placeholder={placeholder}
      showClear={allowClear}
      style={{ width, minWidth: 140 }}
      onChange={(e) => onChange((e.value ?? "ALL") as T | "ALL")}
    />
  );
}
