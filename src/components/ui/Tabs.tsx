import { useRef } from "react";

export interface TabItem {
  value: string;
  label: string;
}

export interface TabsProps {
  items: TabItem[];
  active: string;
  onChange?: (value: string) => void;
  id?: string;
  className?: string;
}

export function Tabs({ items, active, onChange, id = "tabs", className = "" }: TabsProps): JSX.Element {
  const tabIdx = Math.max(0, items.findIndex((it) => it.value === active));
  const ref = useRef<HTMLDivElement | null>(null);
  return (
    <div className={`tabs ${className}`} role="tablist" aria-label={id} ref={ref}>
      {items.map((item, i) => {
        const selected = item.value === active;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={selected}
            aria-controls={`${id}-panel`}
            tabIndex={selected ? 0 : -1}
            className={`tab ${selected ? "tab-active" : ""}`}
            onClick={() => onChange?.(item.value)}
            onKeyDown={(e) => {
              const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
              if (!d) return;
              e.preventDefault();
              const next = (items.length + tabIdx + d) % items.length;
              onChange?.(items[next].value);
              const el = ref.current?.querySelectorAll(".tab")[next] as HTMLElement | undefined;
              el?.focus();
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
