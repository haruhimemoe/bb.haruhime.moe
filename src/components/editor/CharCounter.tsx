/**
 * @file src/components/editor/CharCounter.tsx
 * @desc How many of osu!'s 60,000 characters a post uses, counted by the render seam's
 *       countBbcode, with a warning tone once it's over.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { cx } from "@haruhimemoe/ui";

type CharCounterProps = {
  /** Characters used. */
  count: number;
  /** The post's limit. */
  limit: number;
};

/**
 * @function CharCounter
 * @param props {CharCounterProps} the count and the limit
 * @returns {JSX.Element} "1,234 / 60,000 characters", rose when over, with how many to cut
 */
export function CharCounter({ count, limit }: CharCounterProps) {
  const over = count - limit;
  return (
    <p className={cx("text-sm tabular-nums", over > 0 ? "font-bold text-rose-300" : "text-c3")}>
      {count.toLocaleString("en-US")} / {limit.toLocaleString("en-US")} characters
      {over > 0 ? `: ${over.toLocaleString("en-US")} over osu!'s limit` : ""}
    </p>
  );
}
