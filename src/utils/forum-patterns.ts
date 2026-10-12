/**
 * @file src/utils/forum-patterns.ts
 * @desc What osu! forum posts tend to use, mined from post bodies by scripts/mine-forum.mjs:
 *       how many posts use each tag and how often, which tag sits inside which, the sizes and
 *       colors written, box titles common enough to be patterns rather than anyone's words, and
 *       how many posts open with a centred header, carry a notice or use a list. Only counts
 *       leave this file: no post text, names or ids. `tagOrder` sorts tag names by use for
 *       autocomplete. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { type Node, parse } from "@haruhimemoe/bbcode";

/** Counts mined from a set of forum posts. */
export type ForumPatterns = {
  posts: number;
  /** By canonical tag name: posts using it, and uses in all. */
  tags: Record<string, { posts: number; uses: number }>;
  /** `parent>child` tag pairs and how often they occur. */
  pairs: Record<string, number>;
  /** `[size=]` values and how often. */
  sizes: Record<string, number>;
  /** `[color=]` values, lowercase, and how often. */
  colors: Record<string, number>;
  /** Box titles, lowercase, used at least `minTitle` times. */
  boxTitles: Record<string, number>;
  /** Shares of posts (0 to 1). */
  shares: { centreHeader: number; notice: number; list: number };
};

/** How picky the miner is. */
export type MineOptions = {
  /** How many times a box title must appear to be kept (default 5). */
  minTitle?: number;
};

/** No posts mined yet: what the app reads before the script has run. */
export const EMPTY_PATTERNS: ForumPatterns = {
  posts: 0,
  tags: {},
  pairs: {},
  sizes: {},
  colors: {},
  boxTitles: {},
  shares: { centreHeader: 0, notice: 0, list: 0 },
};

const bump = (counts: Record<string, number>, key: string): void => {
  counts[key] = (counts[key] ?? 0) + 1;
};

const firstTag = (nodes: readonly Node[]): string | null => {
  for (const node of nodes) {
    if (node.type === "tag") return node.name;
    if (node.value.trim() !== "") return null;
  }
  return null;
};

/**
 * @function minePatterns
 * @param bodies {readonly string[]} forum post bodies (BBCode)
 * @param options {MineOptions} the box title threshold
 * @returns {ForumPatterns} the counts, holding none of the posts' text
 */
export const minePatterns = (
  bodies: readonly string[],
  { minTitle = 5 }: MineOptions = {},
): ForumPatterns => {
  const out: ForumPatterns = structuredClone(EMPTY_PATTERNS);
  const titles: Record<string, number> = {};
  const has = { centreHeader: 0, notice: 0, list: 0 };
  for (const body of bodies) {
    const seen = new Set<string>();
    const walk = (nodes: readonly Node[], parent: string | null): void => {
      for (const node of nodes) {
        if (node.type !== "tag") continue;
        seen.add(node.name);
        const tag = out.tags[node.name] ?? { posts: 0, uses: 0 };
        tag.uses++;
        out.tags[node.name] = tag;
        if (parent) bump(out.pairs, `${parent}>${node.name}`);
        if (node.name === "size" && node.arg) bump(out.sizes, node.arg);
        if (node.name === "color" && node.arg) bump(out.colors, node.arg.toLowerCase());
        if (node.name === "box" && node.arg) bump(titles, node.arg.trim().toLowerCase());
        walk(node.children, node.name);
      }
    };
    const { children } = parse(body);
    walk(children, null);
    for (const name of seen) (out.tags[name] as { posts: number }).posts++;
    if (firstTag(children) === "centre") has.centreHeader++;
    if (seen.has("notice")) has.notice++;
    if (seen.has("list")) has.list++;
  }
  out.posts = bodies.length;
  out.boxTitles = Object.fromEntries(Object.entries(titles).filter(([, n]) => n >= minTitle));
  const share = (n: number) => (bodies.length === 0 ? 0 : n / bodies.length);
  out.shares = {
    centreHeader: share(has.centreHeader),
    notice: share(has.notice),
    list: share(has.list),
  };
  return out;
};

/**
 * @function tagOrder
 * @param patterns {ForumPatterns} mined counts
 * @param names {readonly string[]} tag names, in their default order
 * @returns {string[]} the names by how many posts use them, most first; ties and unmined names
 *          keep their default order
 */
export const tagOrder = (patterns: ForumPatterns, names: readonly string[]): string[] => {
  const posts = (name: string) => patterns.tags[name]?.posts ?? 0;
  return names
    .map((name, index) => ({ name, index }))
    .sort((a, b) => posts(b.name) - posts(a.name) || a.index - b.index)
    .map(({ name }) => name);
};
