import { useEffect, useState, type ReactNode } from "react";

const BREAKPOINT_PX: Record<
  NonNullable<SidebarProps["breakpoint"]>,
  number
> = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
};

export type SidebarProps = {
  children: ReactNode;
  width?: number;
  breakpoint?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  collapsedWidth?: number;
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  /** `true` when viewport is below `breakpoint`. */
  onBreakpoint?: (broken: boolean) => void;
};

/** Flex sider — fills shell height under Topbar; menu scrolls inside if needed. */
export function Sidebar({
  children,
  width = 220,
  breakpoint = "lg",
  collapsedWidth = 0,
  collapsed,
  onCollapse,
  onBreakpoint,
}: SidebarProps) {
  const [broken, setBroken] = useState(false);
  const isCollapsed = collapsed ?? false;
  const currentWidth = isCollapsed ? collapsedWidth : width;

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${BREAKPOINT_PX[breakpoint] - 1}px)`);
    const apply = () => {
      const nextBroken = mq.matches;
      setBroken(nextBroken);
      onBreakpoint?.(nextBroken);
      if (nextBroken) {
        onCollapse?.(true);
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
    // Intentionally sync breakpoint only; parent owns collapse callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakpoint]);

  return (
    <aside
      data-broken={broken ? "true" : "false"}
      style={{
        width: currentWidth,
        minWidth: currentWidth,
        height: "100%",
        overflow: "auto",
        zIndex: 90,
        flexShrink: 0,
        transition: "width 0.2s ease, min-width 0.2s ease",
        background: "var(--p-surface-section, #1f2937)",
        color: "rgba(255,255,255,0.85)",
      }}
    >
      {currentWidth > 0 ? children : null}
    </aside>
  );
}
