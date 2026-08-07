import type { ChartOptions } from "chart.js";
import { formatVnd } from "@/lib/money";

/** Shared axis/tooltip formatters for revenue charts (Chart.js / PrimeReact Chart). */
export function vndAxisLabel(value: string | number): string {
  return formatVnd(Number(value));
}

export function chartTextColors(isDark: boolean) {
  return {
    text: isDark ? "#e5e7eb" : "#374151",
    muted: isDark ? "#9ca3af" : "#6b7280",
    grid: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
  };
}

function vndTooltipCallback(value: number | null | undefined): string {
  return formatVnd(Number(value ?? 0));
}

/** Line / area chart options with VND y-axis + tooltip. */
export function lineChartOptions(isDark: boolean): ChartOptions<"line"> {
  const c = chartTextColors(isDark);
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => vndTooltipCallback(ctx.parsed.y),
        },
      },
    },
    scales: {
      x: {
        ticks: { color: c.muted },
        grid: { color: c.grid },
      },
      y: {
        ticks: {
          color: c.muted,
          callback: (v) => vndAxisLabel(v),
        },
        grid: { color: c.grid },
      },
    },
  };
}

/** Vertical bar chart options with VND y-axis + tooltip. */
export function barChartOptions(isDark: boolean): ChartOptions<"bar"> {
  const c = chartTextColors(isDark);
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => vndTooltipCallback(ctx.parsed.y),
        },
      },
    },
    scales: {
      x: {
        ticks: { color: c.muted, maxRotation: 45, minRotation: 0 },
        grid: { display: false },
      },
      y: {
        ticks: {
          color: c.muted,
          callback: (v) => vndAxisLabel(v),
        },
        grid: { color: c.grid },
      },
    },
  };
}

/** Doughnut / pie options with VND tooltip and dark/light legend. */
export function pieChartOptions(isDark: boolean): ChartOptions<"doughnut"> {
  const c = chartTextColors(isDark);
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: c.text },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const label = ctx.label ?? "";
            const value = vndTooltipCallback(ctx.parsed);
            return label ? `${label}: ${value}` : value;
          },
        },
      },
    },
  };
}
