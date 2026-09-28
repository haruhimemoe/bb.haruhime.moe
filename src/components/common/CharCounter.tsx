/**
 * @file src/components/common/CharCounter.tsx
 * @desc How many characters of a limit a text uses, with a warning tone and how many to cut once
 *       it's over. Generic: the caller counts (bb counts with @haruhimemoe/bbcode's count).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { cx } from "@haruhimemoe/ui";

type CharCounterProps = {
  /** Characters used. */
  count: number;
  /** The limit. */
  limit: number;
  className?: string;
};

/**
 * @function CharCounter
 * @param props {CharCounterProps} the count and the limit
 * @returns {JSX.Element} "1,234 / 60,000 characters", rose when over, with how many to cut
 */
export function CharCounter({ count, limit, className }: CharCounterProps) {
  const over = count - limit;
  return (
    <p
      className={cx(
        "text-sm tabular-nums",
        over > 0 ? "font-bold text-rose-300" : "text-c3",
        className,
      )}
    >
      {count.toLocaleString("en-US")} / {limit.toLocaleString("en-US")} characters
      {over > 0 ? `: ${over.toLocaleString("en-US")} over the limit` : ""}
    </p>
  );
}
