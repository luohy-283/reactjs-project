import { formatVnd } from "@/lib/money";

/** Shared axis/tooltip formatters for revenue charts (@ant-design/plots). */
export function vndAxisLabel(value: string | number): string {
  return formatVnd(Number(value));
}

export function vndTooltipItems(name = "Doanh thu") {
  return [
    {
      channel: "y" as const,
      name,
      valueFormatter: (v: number) => formatVnd(v),
    },
  ];
}
