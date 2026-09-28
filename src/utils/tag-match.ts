/**
 * @file src/utils/tag-match.ts
 * @desc Finds the tag pair the cursor is on in a parsed @haruhimemoe/bbcode tree: when the
 *       cursor touches an opening or closing tag osu! pairs, both tags' ranges come back so the
 *       editor can mark them. Tags osu! would show as text aren't in the tree, so they never
 *       match. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import type { Node, TagNode } from "@haruhimemoe/bbcode";

/** A range of the source, [from, to). */
export type Span = { from: number; to: number };

const touches = (span: Span, pos: number): boolean => pos >= span.from && pos <= span.to;

const spansOf = (tag: TagNode): Span[] => {
  const open = { from: tag.start, to: tag.start + tag.open.length };
  return tag.close === null ? [open] : [open, { from: tag.end - tag.close.length, to: tag.end }];
};

/**
 * @function matchingTags
 * @param nodes {readonly Node[]} a parsed tree's children
 * @param pos {number} the cursor
 * @returns {Span[]} the opening and closing tag of the innermost pair the cursor touches (just
 *          the opening one for a list item with no close), or none
 */
export const matchingTags = (nodes: readonly Node[], pos: number): Span[] => {
  for (const node of nodes) {
    if (node.type !== "tag" || pos < node.start || pos > node.end) continue;
    const inner = matchingTags(node.children, pos);
    if (inner.length > 0) return inner;
    const spans = spansOf(node);
    if (spans.some((span) => touches(span, pos))) return spans;
  }
  return [];
};
