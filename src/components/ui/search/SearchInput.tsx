import type { CSSProperties } from "react";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

export type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /**
   * Explicit width. When omitted, grows in the filter row
   * (flex 1, min 280px, max 640px) so long placeholders stay visible.
   */
  width?: number | string;
  style?: CSSProperties;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
};

/** Shared list search — controlled text input with clear + search icon. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Tìm kiếm…",
  width,
  style,
  className,
  disabled,
  id,
  name,
}: SearchInputProps) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        flex: width == null ? "1 1 420px" : undefined,
        width: width ?? "100%",
        minWidth: 280,
        maxWidth: width ?? 450,
        ...style,
      }}
    >
      <IconField iconPosition="left" style={{ width: "100%" }}>
        <InputIcon className="pi pi-search" />
        <InputText
          id={id}
          name={name}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: "100%", paddingRight: value ? 36 : undefined }}
        />
      </IconField>
      {value ? (
        <Button
          type="button"
          text
          rounded
          icon="pi pi-times"
          aria-label="Xóa tìm kiếm"
          onClick={() => onChange("")}
          style={{
            position: "absolute",
            right: 2,
            top: "50%",
            transform: "translateY(-50%)",
            width: 28,
            height: 28,
          }}
        />
      ) : null}
    </div>
  );
}
