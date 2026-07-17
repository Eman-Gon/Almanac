"use client";

import { useId, useRef, useState, type ReactNode, type KeyboardEvent } from "react";

export type TabItem = { id: string; label: string; content: ReactNode };

export function Tabs({ items, defaultTab }: { items: TabItem[]; defaultTab?: string }) {
  const generatedId = useId();
  const [activeTab, setActiveTab] = useState(defaultTab ?? items[0]?.id ?? "");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!items.length) return;
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % items.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + items.length) % items.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = items.length - 1;
    if (nextIndex === index) return;
    event.preventDefault();
    setActiveTab(items[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  const active = items.find((item) => item.id === activeTab) ?? items[0];
  if (!active) return null;

  return (
    <div className="accessible-tabs">
      <div className="tab-list" role="tablist" aria-label="Supporting plan details">
        {items.map((item, index) => {
          const selected = item.id === active.id;
          const tabId = `${generatedId}-${item.id}-tab`;
          const panelId = `${generatedId}-${item.id}-panel`;
          return (
            <button
              key={item.id}
              ref={(node) => { tabRefs.current[index] = node; }}
              className="tab-button"
              type="button"
              role="tab"
              id={tabId}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveTab(item.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >{item.label}</button>
          );
        })}
      </div>
      <div className="tab-panel" role="tabpanel" id={`${generatedId}-${active.id}-panel`} aria-labelledby={`${generatedId}-${active.id}-tab`} tabIndex={0}>
        {active.content}
      </div>
    </div>
  );
}
