/**
 * @file src/components/editor/BbPreview.tsx
 * @desc Shows BBCode as the preview, through the one render seam (src/lib/bbcode.ts), whose
 *       output is safe HTML by construction: nothing else ever reaches innerHTML. Its background
 *       is PREVIEW_BACKGROUND, the one colors are checked against. A full preview is laid out at
 *       osu!'s width for its target and fitted to the pane (ScaledPreview), so it wraps as osu!
 *       does. A `fluid` one (a tool's one-line sample) flows in the room it has. A `compact`
 *       preview (the gallery's cards) renders only the first COMPACT_PREVIEW_CHARS characters, is
 *       clipped to a few lines and is inert (hidden from screen readers and unreachable by
 *       keyboard, since a clipped body may hold links), as the card's name already says what it
 *       is; it stays a server component, so a card never sends a whole body.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sat Oct 3, 2026
 */

import { cx } from "@haruhimemoe/ui";
import { ScaledPreview } from "@/components/editor/ScaledPreview";
import { COMPACT_PREVIEW_CHARS, type PostTarget, PREVIEW_BACKGROUND } from "@/constants/editor";
import { renderBbcode } from "@/lib/bbcode";

type BbPreviewProps = {
  /** The BBCode to show. */
  source: string;
  /** Where the post goes on osu!, which sets the width it's laid out at (default userpage). */
  target?: PostTarget;
  /** A short clipped preview (cards) instead of the full one. */
  compact?: boolean;
  /** Flow in the room there is instead of at osu!'s width (short samples in the tools). */
  fluid?: boolean;
  className?: string;
};

/**
 * @function BbPreview
 * @param props {BbPreviewProps} the BBCode, its target and how much room it gets
 * @returns {JSX.Element} the rendered preview
 */
export function BbPreview({
  source,
  target = "userpage",
  compact = false,
  fluid = false,
  className,
}: BbPreviewProps) {
  const scaled = !compact && !fluid;
  const html = (
    <div
      // Scaled, the font size is osu!'s for the target, set on ScaledPreview's canvas.
      className={scaled ? "[&>.bb]:[font-size:inherit]" : undefined}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: @haruhimemoe/bbcode's render escapes every text node and checks every URL; its output is safe HTML by construction.
      dangerouslySetInnerHTML={{
        __html: renderBbcode(compact ? source.slice(0, COMPACT_PREVIEW_CHARS) : source),
      }}
    />
  );
  if (scaled) {
    return (
      <ScaledPreview target={target} className={className}>
        {html}
      </ScaledPreview>
    );
  }
  return (
    <div
      // inert takes the clipped preview out of the tab order too: aria-hidden alone would leave
      // its links focusable but invisible to a screen reader (axe aria-hidden-focus).
      inert={compact ? true : undefined}
      className={cx(
        "bb-preview rounded-md p-3",
        compact ? "max-h-28 overflow-hidden text-xs" : "min-h-40",
        className,
      )}
      style={{ background: PREVIEW_BACKGROUND }}
    >
      {html}
    </div>
  );
}
