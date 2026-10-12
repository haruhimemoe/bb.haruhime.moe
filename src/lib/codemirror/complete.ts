/**
 * @file src/lib/codemirror/complete.ts
 * @desc Tag autocomplete from @haruhimemoe/bbcode's TAGS. After `[` it offers every tag (aliases
 *       too) and writes the pair, with the cursor on the argument when the tag needs one and
 *       then between the tags, tags osu! posts use most ranked higher once the forum has been
 *       mined (src/constants/forum-patterns.ts); after `[/` it offers the closing tag, the
 *       innermost open one first. Each option shows the tag's description. Browser only.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

import {
  type Completion,
  type CompletionContext,
  type CompletionResult,
  snippetCompletion,
} from "@codemirror/autocomplete";
import type { EditorState, TransactionSpec } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { TAGS, type TagSpec } from "@haruhimemoe/bbcode";
import { FORUM_PATTERNS } from "@/constants/forum-patterns";
import { tagDescription } from "@/utils/docs";
import { tagBoost } from "@/utils/forum-patterns";
import { innermostOpen } from "@/utils/tag-typing";

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
      boost: tagBoost(FORUM_PATTERNS, tag.name),
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
 * @function closeCompletionSpec
 * @param state {EditorState} the editor's state
 * @param from {number} where the typed name starts (after `[/`)
 * @param to {number} where it ends
 * @param name {string} the tag to close
 * @returns {TransactionSpec} writes `name]`, taking over the same closing tag when it already
 *          follows (one the editor closed for you), so it isn't doubled
 */
export const closeCompletionSpec = (
  state: EditorState,
  from: number,
  to: number,
  name: string,
): TransactionSpec => {
  const own = `[/${name}]`;
  const end = state.sliceDoc(to, to + own.length) === own ? to + own.length : to;
  return {
    changes: { from, to: end, insert: `${name}]` },
    selection: { anchor: from + name.length + 1 },
    userEvent: "input.complete",
  };
};

/** The innermost open tag's closing option: first in the list, and never doubled. */
const boosted = (option: Completion): Completion => ({
  ...option,
  boost: 99,
  apply: (view: EditorView, _completion: Completion, from: number, to: number) =>
    view.dispatch(closeCompletionSpec(view.state, from, to, option.label)),
});

/**
 * @function completeTags
 * @param context {CompletionContext} where the cursor is
 * @returns {CompletionResult | null} the tag options after `[` or `[/`, or null elsewhere
 */
export const completeTags = (context: CompletionContext): CompletionResult | null => {
  const before = context.matchBefore(/\[\/?[a-z*]*$/);
  if (!before) return null;
  const closing = before.text.startsWith("[/");
  const open = closing ? innermostOpen(context.state.sliceDoc(0, before.from)) : null;
  const options = open
    ? CLOSE.map((option) => (option.label === open ? boosted(option) : option))
    : closing
      ? CLOSE
      : OPEN;
  return { from: before.from + (closing ? 2 : 1), options, validFor: /^[a-z*]*$/ };
};
