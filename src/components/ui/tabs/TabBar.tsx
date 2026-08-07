import type { CSSProperties, ReactNode } from "react";
import { TabView, TabPanel } from "primereact/tabview";

export type TabBarItem = {
  key: string;
  label: ReactNode;
  children?: ReactNode;
  disabled?: boolean;
  closable?: boolean;
};

export type TabBarProps = {
  items?: TabBarItem[];
  activeKey?: string;
  defaultActiveKey?: string;
  onChange?: (key: string) => void;
  style?: CSSProperties;
  className?: string;
  /** Render tab bodies from `items[].children` when true. */
  renderPanels?: boolean;
};

/** Thin wrapper around Prime `TabView` with Ant-like `items` / `activeKey` API. */
export function TabBar({
  items = [],
  activeKey,
  defaultActiveKey,
  onChange,
  style,
  className,
  renderPanels = false,
}: TabBarProps) {
  const keys = items.map((item) => item.key);
  const resolvedKey = activeKey ?? defaultActiveKey ?? keys[0];
  const activeIndex = Math.max(0, keys.indexOf(resolvedKey ?? ""));

  return (
    <TabView
      activeIndex={activeIndex}
      onTabChange={(e) => {
        const key = keys[e.index];
        if (key != null) onChange?.(key);
      }}
      style={style}
      className={className}
    >
      {items.map((item) => (
        <TabPanel
          key={item.key}
          header={typeof item.label === "string" ? item.label : undefined}
          /* Always use headerTemplate so every tab shares the same flex link
           * structure (plain string headers skip this path and sit shorter when
           * sibling tabs render Badges — splits the active underline). */
          headerTemplate={(options) => (
            <a
              className={options.className}
              onClick={options.onClick}
              onKeyDown={options.onKeyDown}
              role="tab"
              aria-controls={options.ariaControls}
              aria-selected={options.selected}
            >
              {item.label}
            </a>
          )}
          disabled={item.disabled}
        >
          {renderPanels ? item.children : null}
        </TabPanel>
      ))}
    </TabView>
  );
}
