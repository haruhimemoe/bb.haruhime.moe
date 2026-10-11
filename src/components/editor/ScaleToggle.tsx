/**
 * @file src/components/editor/ScaleToggle.tsx
 * @desc The preview's "Fit to pane / Actual size" switch, shown when osu!'s width doesn't fit the
 *       pane. Fit shows the zoom it's at.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { SegmentedControl } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("bb.preview");
  return (
    <SegmentedControl<ScaleMode>
      label={t("size")}
      hideLabel
      size="sm"
      className="mb-2 flex justify-end"
      options={MODES.map((option) => ({
        value: option,
        label: option === "fit" ? t("fit", { percent: Math.round(zoom * 100) }) : t("actual"),
      }))}
      value={mode}
      onChange={onChange}
    />
  );
}
