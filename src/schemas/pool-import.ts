/**
 * @file src/schemas/pool-import.ts
 * @desc Pool import's shapes. In: what pools' GET /api/pools/<id> sends that bb reads (the name,
 *       buckets and slots; unknown fields dropped). Out: what bb's GET /api/pools/<id> answers,
 *       one bucket per group with each slot's label, map and star rating under the bucket's
 *       mods, checked again in the browser.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { bucketEntrySchema, poolSlotSchema } from "@haruhimemoe/pool";
import { z } from "zod";

/** The part of pools' built pool answer bb reads. */
export const poolsAnswerSchema = z.object({
  pool: z.object({
    id: z.string(),
    name: z.string(),
    buckets: z.array(bucketEntrySchema).optional(),
    slots: z.array(poolSlotSchema),
  }),
});

/** The part of pools' built pool answer bb reads. */
export type PoolsAnswer = z.infer<typeof poolsAnswerSchema>;

/** One slot as pool import writes it. */
export const importedSlotSchema = z.object({
  label: z.string(),
  beatmapId: z.number().int().positive(),
  /** null when osu! doesn't know the map. */
  map: z
    .object({ artist: z.string(), title: z.string(), version: z.string(), creator: z.string() })
    .nullable(),
  /** Under the bucket's mods; null when it couldn't be looked up this time. */
  stars: z.number().nullable(),
});

/** One slot as pool import writes it. */
export type ImportedSlot = z.infer<typeof importedSlotSchema>;

/** bb's pool import answer. */
export const poolImportSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  buckets: z.array(
    z.object({
      /** The bucket's code, or null for maps without a slot. */
      code: z.string().nullable(),
      /** The mods its stars are for ("HDHR"; "" for none or free mod). */
      mods: z.string(),
      slots: z.array(importedSlotSchema),
    }),
  ),
  /** false when some star rating couldn't be looked up this time. */
  complete: z.boolean(),
});

/** bb's pool import answer. */
export type PoolImport = z.infer<typeof poolImportSchema>;
