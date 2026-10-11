/**
 * @file src/constants/collab.ts
 * @desc The collab maker's copy and its handle positions: the page lead, the hints and the
 *       notices, kept out of the components, and where the collab is saved in the browser.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

import type { Handle } from "@/utils/region-geometry";

/** Where each resize handle sits on its region, as Tailwind classes. */
export const HANDLE_CLASSES: Readonly<Record<Handle, string>> = {
  nw: "-left-1.5 -top-1.5 cursor-nwse-resize",
  n: "left-1/2 -top-1.5 -translate-x-1/2 cursor-ns-resize",
  ne: "-right-1.5 -top-1.5 cursor-nesw-resize",
  e: "-right-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize",
  se: "-right-1.5 -bottom-1.5 cursor-nwse-resize",
  s: "left-1/2 -bottom-1.5 -translate-x-1/2 cursor-ns-resize",
  sw: "-left-1.5 -bottom-1.5 cursor-nesw-resize",
  w: "-left-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize",
};

/** localStorage key of the collab being made: `{ image, regions }`, restored on load. */
export const COLLAB_KEY = "bb:collab";

/** Most regions a stored collab brings back (more is a damaged or foreign entry). */
export const STORED_REGIONS_MAX = 500;
