/**
 * @file src/components/editor/BbPreview.tsx
 * @desc Shows BBCode as the preview, through the one render seam (src/lib/bbcode.ts), whose
 *       output is safe HTML by construction: nothing else ever reaches innerHTML. Its background
 *       is PREVIEW_BACKGROUND, the one colors are checked against. A `compact`
 *       preview (the gallery's cards) is clipped to a few lines and hidden from screen readers,
 *       since the card's name already says what it is.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { cx } from "@haruhimemoe/ui";
import { PREVIEW_BACKGROUND } from "@/constants/editor";
import { renderBbcode } from "@/lib/bbcode";

type BbPreviewProps = {
  /** The BBCode to show. */
  source: string;
  /** A short clipped preview (cards) instead of the full one. */
  compact?: boolean;
  className?: string;
};

/**
 * @function BbPreview
 * @param props {BbPreviewProps} the BBCode and how much room it gets
 * @returns {JSX.Element} the rendered preview
 */
export function BbPreview({ source, compact = false, className }: BbPreviewProps) {
  return (
    <div
      aria-hidden={compact ? true : undefined}
      className={cx(
        "bb-preview rounded-md p-3",
        compact ? "max-h-28 overflow-hidden text-xs" : "min-h-40",
        className,
      )}
      style={{ background: PREVIEW_BACKGROUND }}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: @haruhimemoe/bbcode's render escapes every text node and checks every URL; its output is safe HTML by construction.
      dangerouslySetInnerHTML={{ __html: renderBbcode(source) }}
    />
  );
}
