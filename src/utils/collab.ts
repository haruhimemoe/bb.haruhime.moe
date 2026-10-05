/**
 * @file src/utils/collab.ts
 * @desc The collab maker's state: the image URL, its regions (a box, a link and a title each) and
 *       which one is selected, changed only through collabReducer. Also the way in and out:
 *       collabOutput writes the [imagemap] with @haruhimemoe/bbcode's serializeImagemap after
 *       validateImagemap, and importImagemap reads one back with parseImagemap. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

import {
  type ImagemapIssue,
  type ImagemapProblem,
  parseImagemap,
  serializeImagemap,
  validateImagemap,
} from "@haruhimemoe/bbcode/imagemap";
import { moveItem } from "@haruhimemoe/ui";
import { fitRect, type Rect } from "@/utils/region-geometry";

/** One region: its box in percent, where it links (`#` for nowhere) and its hover text. */
export type CollabRegion = Rect & { id: string; href: string; title: string };

/** Everything the collab maker holds. */
export type CollabState = { image: string; regions: CollabRegion[]; selected: string | null };

/** A link and title to put on a region (from a player lookup). */
export type RegionLink = { href: string; title: string };

/** What collabReducer understands. */
export type CollabAction =
  | { type: "image"; image: string }
  | { type: "add"; id: string; rect: Rect }
  | { type: "rect"; id: string; rect: Rect }
  | { type: "field"; id: string; field: "href" | "title"; value: string }
  | { type: "remove"; id: string }
  | { type: "move"; id: string; to: number }
  | { type: "reorder"; id: string; by: -1 | 1 }
  | { type: "select"; id: string | null }
  | { type: "load"; state: CollabState }
  | { type: "links"; links: readonly RegionLink[] };

/** A fresh collab maker: no image, no regions. */
export const EMPTY_COLLAB: CollabState = { image: "", regions: [], selected: null };

/**
 * @function applyLinks
 * @param regions {CollabRegion[]} the regions
 * @param links {readonly RegionLink[]} links in order
 * @returns {CollabRegion[]} the first regions given those links and titles, the rest unchanged
 */
const applyLinks = (regions: CollabRegion[], links: readonly RegionLink[]): CollabRegion[] =>
  regions.map((region, i) => {
    const link = links[i];
    return link ? { ...region, href: link.href, title: link.title } : region;
  });

/**
 * @function moveRegion
 * @param state {CollabState} the state
 * @param id {string} the region to move
 * @param to {number} its index after the move
 * @returns {CollabState} the regions reordered, or the same state for an unknown region, an
 *          index outside the list or no move
 */
const moveRegion = (state: CollabState, id: string, to: number): CollabState => {
  const from = state.regions.findIndex((region) => region.id === id);
  if (from < 0 || to < 0 || to >= state.regions.length || to === from) return state;
  return { ...state, regions: moveItem(state.regions, from, to) };
};

/**
 * @function collabReducer
 * @param state {CollabState} the current state
 * @param action {CollabAction} what happened
 * @returns {CollabState} the next state (a new region is selected; a removed one unselected)
 */
export const collabReducer = (state: CollabState, action: CollabAction): CollabState => {
  const change = (id: string, map: (region: CollabRegion) => CollabRegion): CollabState => ({
    ...state,
    regions: state.regions.map((region) => (region.id === id ? map(region) : region)),
  });
  switch (action.type) {
    case "image":
      return { ...state, image: action.image };
    case "add": {
      const region = { ...fitRect(action.rect), id: action.id, href: "#", title: "" };
      return { ...state, regions: [...state.regions, region], selected: action.id };
    }
    case "rect":
      return change(action.id, (region) => ({ ...region, ...fitRect(action.rect) }));
    case "field":
      return change(action.id, (region) => ({ ...region, [action.field]: action.value }));
    case "remove":
      return {
        ...state,
        regions: state.regions.filter((region) => region.id !== action.id),
        selected: state.selected === action.id ? null : state.selected,
      };
    case "move":
      return moveRegion(state, action.id, action.to);
    case "reorder": {
      // The Up and Down alias: one place either way.
      const from = state.regions.findIndex((region) => region.id === action.id);
      return from < 0 ? state : moveRegion(state, action.id, from + action.by);
    }
    case "select":
      return { ...state, selected: action.id };
    case "load":
      return action.state;
    case "links":
      return { ...state, regions: applyLinks(state.regions, action.links) };
  }
};

/** collabOutput's answer: the [imagemap] when it's valid, and every problem otherwise. */
export type CollabOutput = { bbcode: string | null; problems: ImagemapProblem[] };

/**
 * @function collabOutput
 * @param state {CollabState} the collab maker's state
 * @returns {CollabOutput} the block from serializeImagemap, or null with validateImagemap's
 *          problems (a bad image URL, no regions, a bad link or title)
 */
export const collabOutput = (state: CollabState): CollabOutput => {
  const map = {
    image: state.image.trim(),
    regions: state.regions.map(({ x, y, w, h, href, title }) => ({
      x,
      y,
      w,
      h,
      href: href.trim(),
      title,
    })),
  };
  const problems = validateImagemap(map);
  return problems.length > 0
    ? { bbcode: null, problems }
    : { bbcode: serializeImagemap(map), problems };
};

/** importImagemap's answer: the loaded state, or what osu! would refuse in the text. */
export type ImportResult =
  | { ok: true; state: CollabState }
  | { ok: false; issues: ImagemapIssue[] };

/**
 * @function importImagemap
 * @param text {string} a pasted [imagemap] block, or only what's inside it
 * @param newId {() => string} makes each region's id
 * @returns {ImportResult} the image and regions (boxes rounded to 2 decimals, at least 1% a side and inside the
 *          image), or every issue parseImagemap found
 */
export const importImagemap = (text: string, newId: () => string): ImportResult => {
  const trimmed = text.trim();
  // Inside the tags, osu! wants a newline before the image and after every line: a bare paste
  // lost both to the trim.
  const parsed = parseImagemap(trimmed.startsWith("[") ? trimmed : `\n${trimmed}\n`);
  if (!parsed.ok) return { ok: false, issues: parsed.issues };
  const regions = parsed.imagemap.regions.map((region) => ({
    ...fitRect(region),
    id: newId(),
    href: region.href,
    title: region.title,
  }));
  return { ok: true, state: { image: parsed.imagemap.image, regions, selected: null } };
};

/**
 * @function problemFor
 * @param problems {readonly ImagemapProblem[]} validateImagemap's problems
 * @param field {string} a field path, like "image" or "regions.2.href"
 * @returns {string | undefined} the first problem's message for that field
 */
export const problemFor = (
  problems: readonly ImagemapProblem[],
  field: string,
): string | undefined => problems.find((problem) => problem.field === field)?.message;

/**
 * @function imageUrlKind
 * @param text {string} a typed image URL
 * @returns {"https" | "http" | null} its scheme when it's a web URL without spaces; null
 *          otherwise (data:, javascript:, a relative path or junk)
 */
export const imageUrlKind = (text: string): "https" | "http" | null => {
  const trimmed = text.trim();
  if (trimmed === "" || /\s/.test(trimmed) || !URL.canParse(trimmed)) return null;
  const { protocol } = new URL(trimmed);
  if (protocol === "https:") return "https";
  return protocol === "http:" ? "http" : null;
};
