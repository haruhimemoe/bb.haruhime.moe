/**
 * @file src/components/editor/PostStatus.tsx
 * @desc Under the editor: what the post is for (userpage, forum post or beatmap description,
 *       each with its own limit), the character count against it, and Copy, with a warning when
 *       the text is over the limit osu! will refuse.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { CharCounter, CopyButton, Notice } from "@haruhimemoe/ui";
import { POST_TARGETS, type PostTarget } from "@/constants/editor";
import { countBbcode } from "@/lib/bbcode";

type PostStatusProps = {
  text: string;
  target: PostTarget;
  onTarget: (target: PostTarget) => void;
};

const isTarget = (value: string): value is PostTarget =>
  POST_TARGETS.some((target) => target.id === value);

/**
 * @function PostStatus
 * @param props {PostStatusProps} the text, the target and its change handler
 * @returns {JSX.Element} the target menu, the counter, Copy and the over-limit warning
 */
export function PostStatus({ text, target, onTarget }: PostStatusProps) {
  const chosen = POST_TARGETS.find((one) => one.id === target) ?? POST_TARGETS[0];
  const count = countBbcode(text);
  const over = count - chosen.limit;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-c3 text-sm">
          For
          <select
            value={target}
            onChange={(event) => isTarget(event.target.value) && onTarget(event.target.value)}
            className="h-8 rounded-md bg-b4 px-2 text-c2"
          >
            {POST_TARGETS.map((one) => (
              <option key={one.id} value={one.id}>
                {one.label}
              </option>
            ))}
          </select>
        </label>
        <CharCounter count={count} limit={chosen.limit} />
        <CopyButton
          text={text}
          label="Copy BBCode"
          disabled={text === ""}
          wrapperClassName="ml-auto"
        />
      </div>
      <Notice tone="warning" live>
        {over > 0
          ? `This is ${over.toLocaleString("en-US")} characters over the ${chosen.limit.toLocaleString("en-US")} a ${chosen.label.toLowerCase()} holds. osu! won't save it until it's shorter.`
          : ""}
      </Notice>
    </div>
  );
}
