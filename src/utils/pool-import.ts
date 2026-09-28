/**
 * @file src/utils/pool-import.ts
 * @desc Pool import's pure half. poolGroups splits a pool's slots by bucket in the pool's own
 *       order (maps without a slot last), with the mods each bucket's star ratings are for
 *       (@haruhimemoe/pool's slotModsFor: NM none, HD/HR/DT that mod, FM and TB free, a custom
 *       bucket its own). poolBbcode writes the mappool section: a heading with the pool's name,
 *       then a box (or a bold heading) per bucket with one line per slot.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { box, escapeBBCode } from "@haruhimemoe/bbcode/helpers";
import {
  bucketsOf,
  type ModAcronym,
  modsLabel,
  type PoolSlot,
  slotLabel,
  slotModsFor,
  sortSlots,
} from "@haruhimemoe/pool";
import type { ImportedSlot, PoolImport, PoolsAnswer } from "@/schemas/pool-import";

/** One bucket's slots and the mods its star ratings are for. */
export type PoolGroup = { code: string | null; mods: readonly ModAcronym[]; slots: PoolSlot[] };

/**
 * @function poolGroups
 * @param pool {PoolsAnswer["pool"]} the pool as pools sent it
 * @returns {PoolGroup[]} its buckets in order, each with its slots in order; empty buckets left
 *          out; maps without a slot last, with no mods
 */
export const poolGroups = (pool: PoolsAnswer["pool"]): PoolGroup[] => {
  const buckets = bucketsOf(pool);
  const slots = sortSlots(pool.slots, buckets);
  const groups: PoolGroup[] = buckets.map((entry) => {
    const mods = slotModsFor(entry);
    return {
      code: entry.code,
      mods: mods.kind === "forced" ? mods.set : [],
      slots: slots.filter((slot) => slot.mod === entry.code),
    };
  });
  groups.push({ code: null, mods: [], slots: slots.filter((slot) => slot.mod === null) });
  return groups.filter((group) => group.slots.length > 0);
};

/**
 * @function starKey
 * @param mods {readonly ModAcronym[]} a bucket's mods
 * @returns {string} how its star rating is kept: "HDHR", or "" for none
 */
export const starKey = (mods: readonly ModAcronym[]): string => modsLabel(mods);

/**
 * @function labelOf
 * @param slot {PoolSlot} a slot
 * @returns {string} "NM1", "Speed2", or "4" for a map without a slot
 */
export const labelOf = (slot: PoolSlot): string => slotLabel(slot);

/** How pool import writes each bucket. */
export type PoolLayout = "boxes" | "headings";

/**
 * @function slotLine
 * @param slot {ImportedSlot} one slot
 * @returns {string} "[b]NM1[/b] [url=https://osu.ppy.sh/b/<id>]Artist - Title [Version][/url]
 *          5.43★ by Mapper", with every name escaped; "?★" for an unknown rating
 */
export const slotLine = (slot: ImportedSlot): string => {
  const url = `https://osu.ppy.sh/b/${slot.beatmapId}`;
  const stars = slot.stars === null ? "?★" : `${slot.stars.toFixed(2)}★`;
  if (!slot.map) return `[b]${slot.label}[/b] [url=${url}]Beatmap ${slot.beatmapId}[/url] ${stars}`;
  const { artist, title, version, creator } = slot.map;
  const name = escapeBBCode(`${artist} - ${title} [${version}]`);
  return `[b]${escapeBBCode(slot.label)}[/b] [url=${url}]${name}[/url] ${stars} by ${escapeBBCode(creator)}`;
};

/**
 * @function poolBbcode
 * @param pool {PoolImport} bb's pool import answer
 * @param layout {PoolLayout} a [box] per bucket, or a bold heading per bucket
 * @returns {string} the mappool section
 */
export const poolBbcode = (pool: PoolImport, layout: PoolLayout): string => {
  const sections = pool.buckets.map((bucket) => {
    const title = escapeBBCode(bucket.code ?? "Other maps");
    const lines = bucket.slots.map(slotLine).join("\n");
    return layout === "boxes" ? box(title, lines) : `[b]${title}[/b]\n${lines}`;
  });
  return [`[heading]${escapeBBCode(pool.name)}[/heading]`, ...sections].join("\n\n");
};
