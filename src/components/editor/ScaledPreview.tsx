/**
 * @file src/components/editor/ScaledPreview.tsx
 * @desc Lays the preview out at the width osu! shows the post at (OSU_WIDTHS, with its font
 *       size), so lines and image rows wrap where they do on osu!, then zooms it down to fit the
 *       pane (CSS zoom: layout height, crisp text and pointer targets all follow) or leaves it at
 *       osu!'s size to scroll sideways. Never zooms up. BbPreview gives it the rendered HTML.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { OSU_FONT_SIZES, OSU_WIDTHS } from "@haruhimemoe/bbcode";
import { cx } from "@haruhimemoe/ui";
import type { ReactNode } from "react";
import { ScaleToggle } from "@/components/editor/ScaleToggle";
import { type PostTarget, PREVIEW_BACKGROUND } from "@/constants/editor";
import { useFitZoom } from "@/hooks/useFitZoom";
import { usePreviewScale } from "@/hooks/usePreviewScale";

type ScaledPreviewProps = {
  /** Where the post goes on osu!, which sets the width and font size. */
  target: PostTarget;
  /** The rendered preview. */
  children: ReactNode;
  className?: string;
};

/**
 * @function ScaledPreview
 * @param props {ScaledPreviewProps} the target, the rendered preview and extra classes
 * @returns {JSX.Element} the preview at osu!'s width, fitted to the pane
 */
export function ScaledPreview({ target, children, className }: ScaledPreviewProps) {
  const width = OSU_WIDTHS[target];
  const [mode, setMode] = usePreviewScale();
  const { ref, zoom } = useFitZoom(width);
  return (
    <div
      className={cx("bb-preview min-h-40 rounded-md p-3", className)}
      style={{ background: PREVIEW_BACKGROUND }}
    >
      {zoom < 1 ? <ScaleToggle mode={mode} zoom={zoom} onChange={setMode} /> : null}
      <div
        ref={ref}
        data-scale={mode}
        className={cx(
          "[contain:inline-size]",
          mode === "actual" ? "overflow-x-auto" : "overflow-hidden",
        )}
      >
        <div style={{ width, fontSize: OSU_FONT_SIZES[target], zoom: mode === "fit" ? zoom : 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
