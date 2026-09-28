/**
 * @file src/utils/collab-storage.ts
 * @desc The collab maker's saved copy: the image URL and regions as JSON under COLLAB_KEY, read
 *       back through a schema so a damaged or foreign entry is ignored, never trusted. Regions
 *       are fitted into the image again and get fresh ids. Storage calls go through
 *       src/utils/storage.ts, so a blocked or full localStorage changes nothing.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { z } from "zod";
import { COLLAB_KEY, STORED_REGIONS_MAX } from "@/constants/collab";
import type { CollabState } from "@/utils/collab";
import { fitRect } from "@/utils/region-geometry";
import { readStored, type StorageLike, takeStored, writeStored } from "@/utils/storage";

const storedCollabSchema = z.object({
  image: z.string().max(2048),
  regions: z
    .array(
      z.object({
        x: z.number().finite(),
        y: z.number().finite(),
        w: z.number().finite(),
        h: z.number().finite(),
        href: z.string().max(2048),
        title: z.string().max(512),
      }),
    )
    .max(STORED_REGIONS_MAX),
});

/**
 * @function loadCollab
 * @param newId {() => string} a fresh region id, so restored ids never clash with new ones
 * @param storage {StorageLike | null} where (default localStorage)
 * @returns {CollabState | null} the saved collab, nothing selected, or null when there's none
 *          (or it can't be read, or it's empty)
 */
export const loadCollab = (
  newId: () => string,
  storage?: StorageLike | null,
): CollabState | null => {
  const text = readStored(COLLAB_KEY, storage);
  if (text === null) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  const parsed = storedCollabSchema.safeParse(raw);
  if (!parsed.success) return null;
  const { image, regions } = parsed.data;
  if (image === "" && regions.length === 0) return null;
  return {
    image,
    regions: regions.map(({ href, title, ...rect }) => ({
      ...fitRect(rect),
      id: newId(),
      href,
      title,
    })),
    selected: null,
  };
};

/**
 * @function saveCollab
 * @param state {CollabState} the collab as it stands
 * @param storage {StorageLike | null} where (default localStorage)
 * @returns {boolean} whether it reached storage (an empty collab removes the saved one)
 */
export const saveCollab = (state: CollabState, storage?: StorageLike | null): boolean => {
  if (state.image === "" && state.regions.length === 0) {
    takeStored(COLLAB_KEY, storage);
    return true;
  }
  const regions = state.regions.map(({ x, y, w, h, href, title }) => ({ x, y, w, h, href, title }));
  return writeStored(COLLAB_KEY, JSON.stringify({ image: state.image, regions }), storage);
};

/**
 * @function clearCollab
 * @param storage {StorageLike | null} where (default localStorage)
 * @returns {void} forgets the saved collab
 */
export const clearCollab = (storage?: StorageLike | null): void => {
  takeStored(COLLAB_KEY, storage);
};
