/**
 * @file src/lib/codemirror/complete.ts
 * @desc Tag autocomplete from @haruhimemoe/bbcode's TAGS. After `[` it offers every tag (aliases
 *       too) and writes the pair, with the cursor on the argument when the tag needs one and
 *       then between the tags; after `[/` it offers the closing tag. Each option shows the tag's
 *       description. Browser only.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import {
  type Completion,
  type CompletionContext,
  type CompletionResult,
  snippetCompletion,
} from "@codemirror/autocomplete";
import { TAGS, type TagSpec } from "@haruhimemoe/bbcode";
import { tagDescription } from "@/utils/docs";

/** What goes after `=` while typing, by the tag's argument kind. */
const ARG_HINTS: Readonly<Record<string, string>> = {
  color: "#ff66aa",
  size: "150",
  title: "Title",
  name: '"name"',
  list: "1",
  url: "https://",
  email: "name@example.com",
  "user-id": "2",
};

const snippetFor = (tag: TagSpec, name: string): string => {
  if (name === "*") return `*]\${}`;
  const arg = tag.arg === "required" ? `=\${${ARG_HINTS[tag.argKind ?? ""] ?? "value"}}` : "";
  const gap = tag.display === "block" && !tag.singleLine ? "\n" : "";
  return `${name}${arg}]${gap}\${}${gap}[/${name}]`;
};

/** Options for an opening tag: every name and alias. */
const OPEN: readonly Completion[] = TAGS.flatMap((tag) =>
  [tag.name, ...tag.aliases].map((name) =>
    snippetCompletion(snippetFor(tag, name), {
      label: name,
      detail: tag.arg === "required" ? "needs =" : undefined,
      info: tagDescription(tag),
      type: "keyword",
    }),
  ),
);

/** Options for a closing tag (list items have none). */
const CLOSE: readonly Completion[] = TAGS.filter((tag) => tag.name !== "*").flatMap((tag) =>
  [tag.name, ...tag.aliases].map((name) => ({
    label: name,
    apply: `${name}]`,
    info: tagDescription(tag),
    type: "keyword",
  })),
);

/**
 * @function completeTags
 * @param context {CompletionContext} where the cursor is
 * @returns {CompletionResult | null} the tag options after `[` or `[/`, or null elsewhere
 */
export const completeTags = (context: CompletionContext): CompletionResult | null => {
  const before = context.matchBefore(/\[\/?[a-z*]*$/);
  if (!before) return null;
  const closing = before.text.startsWith("[/");
  return {
    from: before.from + (closing ? 2 : 1),
    options: closing ? CLOSE : OPEN,
    validFor: /^[a-z*]*$/,
  };
};
