/**
 * @file src/components/common/Tabs.tsx
 * @desc A tab list for panels on the same page (not links): buttons with role="tab", the chosen
 *       one aria-selected and in the Tab order, Left and Right (and Home and End) move between
 *       them. The panels are the caller's: give each `id={tabPanelId(idPrefix, tab)}`,
 *       role="tabpanel" and aria-labelledby={tabId(idPrefix, tab)}. Generic.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { cx } from "@haruhimemoe/ui";
import type { KeyboardEvent } from "react";
import { tabId, tabPanelId } from "@/utils/tabs";

type TabsProps<T extends string> = {
  /** Names the tab list. */
  label: string;
  /** Prefix for the tabs' and panels' ids. */
  idPrefix: string;
  tabs: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
};

/**
 * @function Tabs
 * @param props {TabsProps<T>} the list's name, id prefix, tabs, the chosen one and the handler
 * @returns {JSX.Element} the tab list
 */
export function Tabs<T extends string>({
  label,
  idPrefix,
  tabs,
  value,
  onChange,
  className,
}: TabsProps<T>) {
  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    const at = tabs.findIndex((tab) => tab.id === value);
    const next = {
      ArrowRight: (at + 1) % tabs.length,
      ArrowLeft: (at - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[event.key];
    const tab = next === undefined ? undefined : tabs[next];
    if (!tab) return;
    event.preventDefault();
    onChange(tab.id);
    document.getElementById(tabId(idPrefix, tab.id))?.focus();
  };
  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={move}
      className={cx("flex gap-1 rounded-full bg-b4 p-1", className)}
    >
      {tabs.map((tab) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={tabId(idPrefix, tab.id)}
            aria-selected={selected}
            aria-controls={tabPanelId(idPrefix, tab.id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cx(
              "flex-1 rounded-full px-4 py-1.5 font-bold text-sm transition-colors",
              selected ? "bg-h2 text-c1" : "text-c3 hover:text-c1",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
