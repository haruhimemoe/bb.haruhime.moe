/**
 * @file src/components/editor/ScaleToggle.tsx
 * @desc The preview's "Fit to pane / Actual size" switch, shown when osu!'s width doesn't fit the
 *       pane. Fit shows the zoom it's at.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

"use client";

import { SegmentedControl } from "@haruhimemoe/ui";
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
 * @returns {JSX.Element} the preview size switch, a segmented control of two radios
 */
export function ScaleToggle({ mode, zoom, onChange }: ScaleToggleProps) {
  return (
    <SegmentedControl<ScaleMode>
      label="Preview size"
      hideLabel
      size="sm"
      className="mb-2 flex justify-end"
      options={MODES.map((option) => ({
        value: option,
        label:
          option === "fit"
            ? `${PREVIEW_SCALE_LABELS.fit} (${Math.round(zoom * 100)}%)`
            : PREVIEW_SCALE_LABELS[option],
      }))}
      value={mode}
      onChange={onChange}
    />
  );
}
