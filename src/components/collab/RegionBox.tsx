/**
 * @file src/components/collab/RegionBox.tsx
 * @desc One region drawn over the collab image: a numbered, focusable box placed in percent,
 *       with resize handles while it's selected. Arrow keys nudge it (Shift for bigger steps,
 *       Alt to resize); Delete removes it. Pointer drags are handled by the canvas
 *       (useRegionPointer), which finds the box and its handles by their data attributes.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { cx } from "@haruhimemoe/ui";
import type { KeyboardEvent } from "react";
import { HANDLE_CLASSES } from "@/constants/collab";
import type { CollabAction, CollabRegion } from "@/utils/collab";
import { HANDLES, nudgeRect } from "@/utils/region-geometry";

type RegionBoxProps = {
  region: CollabRegion;
  /** Its place in the list, from 1. */
  number: number;
  selected: boolean;
  dispatch: (action: CollabAction) => void;
};

/**
 * @function RegionBox
 * @param props {RegionBoxProps} the region, its number, whether it's selected and the dispatch
 * @returns {JSX.Element} the box, its number and (when selected) its handles
 */
export function RegionBox({ region, number, selected, dispatch }: RegionBoxProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      dispatch({ type: "remove", id: region.id });
      return;
    }
    const rect = nudgeRect(region, event.key, { large: event.shiftKey, resize: event.altKey });
    if (!rect) return;
    event.preventDefault();
    dispatch({ type: "rect", id: region.id, rect });
  };
  const name = region.title.trim() || (region.href === "#" ? "no link" : region.href);
  return (
    // biome-ignore lint/a11y/useSemanticElements: a positioned box with handles inside; a button can't hold them.
    <div
      role="button"
      tabIndex={0}
      aria-label={`Region ${number}: ${name}`}
      aria-pressed={selected}
      data-region-id={region.id}
      onKeyDown={onKeyDown}
      onFocus={() => dispatch({ type: "select", id: region.id })}
      className={cx(
        "absolute cursor-move border-2 outline-none",
        selected
          ? "z-10 border-h1 bg-h1/25"
          : "border-white/80 bg-black/20 hover:bg-black/10 focus-visible:border-h1",
      )}
      style={{
        left: `${region.x}%`,
        top: `${region.y}%`,
        width: `${region.w}%`,
        height: `${region.h}%`,
      }}
    >
      <span className="pointer-events-none absolute top-0 left-0 bg-black/70 px-1 font-bold text-white text-xs">
        {number}
      </span>
      {selected
        ? HANDLES.map((handle) => (
            <span
              key={handle}
              data-handle={handle}
              aria-hidden="true"
              className={cx(
                "absolute size-3 touch-none rounded-sm border border-black bg-white before:absolute before:-inset-2 before:content-['']",
                HANDLE_CLASSES[handle],
              )}
            />
          ))
        : null}
    </div>
  );
}
