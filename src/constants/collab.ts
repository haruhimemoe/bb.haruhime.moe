/**
 * @file src/constants/collab.ts
 * @desc The collab maker's copy and its handle positions: the page lead, the hints and the
 *       notices, kept out of the components.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import type { Handle } from "@/utils/region-geometry";

/** The page's lead under its title. */
export const COLLAB_LEAD =
  "Draw link regions over an image hosted anywhere and get the [imagemap] for your userpage or forum post. The image loads from its own host in your browser; bb never fetches or keeps it.";

/** Shown over the canvas before an image loads. */
export const CANVAS_HINT = "Paste an image URL above to start.";

/** How to draw and change regions. */
export const DRAW_HINT =
  "Drag on the image to draw a region. Drag a region to move it, or its corners and edges to resize it. With a region focused, arrow keys move it (Shift for bigger steps) and Alt with arrows resizes it.";

/** Shown when the image didn't load. */
export const IMAGE_FAILED =
  "That image didn't load. Check the URL opens as an image in a new tab; some hosts refuse to be shown on other sites.";

/** Shown for an http image, which the page's rules won't load. */
export const HTTP_IMAGE =
  "This page only shows https images, so an http one won't load here. osu! may still show it; use an https link if the host has one.";

/** The link field's hint. */
export const LINK_HINT = "An osu! profile or any http(s) or mailto link, or # for none.";

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
