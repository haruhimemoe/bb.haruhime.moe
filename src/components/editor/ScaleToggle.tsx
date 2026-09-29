/**
 * @file src/components/editor/ScaleToggle.tsx
 * @desc The preview's "Fit to pane / Actual size" switch, shown when osu!'s width doesn't fit the
 *       pane. Fit shows the zoom it's at.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { PREVIEW_SCALE_LABELS } from "@/constants/editor";
import type { ScaleMode } from "@/utils/preview-scale";

type ScaleToggleProps = {
  /** The current choice. */
  mode: ScaleMode;
  /** The zoom "fit" is at, 0 to 1. */
  zoom: number;
  /** Takes the new choice. */
  onChange: (mode: ScaleMode) => void;
};

const MODES: readonly ScaleMode[] = ["fit", "actual"];

/**
 * @function ScaleToggle
 * @param props {ScaleToggleProps} the choice, the fit zoom and the setter
 * @returns {JSX.Element} two small pressed/unpressed buttons
 */
export function ScaleToggle({ mode, zoom, onChange }: ScaleToggleProps) {
  return (
    <fieldset className="mb-2 flex justify-end gap-1 text-xs">
      <legend className="sr-only">Preview size</legend>
      {MODES.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={mode === option}
          onClick={() => onChange(option)}
          className="rounded px-2 py-0.5 text-c2 hover:text-c1 aria-pressed:bg-b2 aria-pressed:text-c1"
        >
          {PREVIEW_SCALE_LABELS[option]}
          {option === "fit" ? ` (${Math.round(zoom * 100)}%)` : null}
        </button>
      ))}
    </fieldset>
  );
}
