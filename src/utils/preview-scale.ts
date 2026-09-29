/**
 * @file src/utils/preview-scale.ts
 * @desc The preview's scale. It is drawn at the width osu! shows the post at (OSU_WIDTHS) so text
 *       and image rows wrap where they do on osu!, then zoomed down to fit the pane ("fit") or
 *       shown at osu!'s own size, scrolling sideways ("actual"). The choice is kept in storage.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { type PostTarget, PREVIEW_SCALE_KEY } from "@/constants/editor";
import type { TemplateKind } from "@/constants/templates";
import { readStored, type StorageLike, writeStored } from "@/utils/storage";

/** How the preview is sized: zoomed to fit the pane, or at osu!'s actual size. */
export type ScaleMode = "fit" | "actual";

/**
 * @function fitZoom
 * @param available {number} the pane's width in px
 * @param width {number} osu!'s width for the post in px
 * @returns {number} the zoom that fits `width` into `available`, at most 1 (never scaled up),
 *          rounded down to 3 decimals so the result never overflows; 1 before anything is measured
 */
export const fitZoom = (available: number, width: number): number => {
  if (!(available > 0) || !(width > 0)) return 1;
  return Math.min(1, Math.floor((available / width) * 1000) / 1000);
};

/**
 * @function parseScaleMode
 * @param stored {string | null} what storage holds
 * @returns {ScaleMode} "actual" when that was chosen, otherwise "fit"
 */
export const parseScaleMode = (stored: string | null): ScaleMode =>
  stored === "actual" ? "actual" : "fit";

/**
 * @function loadScaleMode
 * @param storage {StorageLike | null} where (default localStorage)
 * @returns {ScaleMode} the remembered choice, "fit" when there's none or storage fails
 */
export const loadScaleMode = (storage?: StorageLike | null): ScaleMode =>
  parseScaleMode(readStored(PREVIEW_SCALE_KEY, storage));

/**
 * @function saveScaleMode
 * @param mode {ScaleMode} the choice
 * @param storage {StorageLike | null} where (default localStorage)
 * @returns {boolean} true when it was saved
 */
export const saveScaleMode = (mode: ScaleMode, storage?: StorageLike | null): boolean =>
  writeStored(PREVIEW_SCALE_KEY, mode, storage);

/**
 * @function previewTargetFor
 * @param kind {TemplateKind} what a template is for
 * @returns {PostTarget} the osu! column it shows in: tournament posts are forum threads, and
 *          anything else is previewed as a userpage
 */
export const previewTargetFor = (kind: TemplateKind): PostTarget => {
  if (kind === "forum" || kind === "tournament") return "forum";
  if (kind === "beatmap") return "beatmap";
  return "userpage";
};
