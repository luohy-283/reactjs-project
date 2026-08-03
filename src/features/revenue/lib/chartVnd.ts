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

/** G2 theme for plots — does not follow Ant Design ConfigProvider automatically. */
export function plotTheme(isDark: boolean) {
  return {
    type: isDark ? ("classicDark" as const) : ("classic" as const),
    view: { viewFill: "transparent" },
  };
}
