/**
 * @file src/schemas/draft.ts
 * @desc The shape of the editor's named drafts as they sit in localStorage: which one is open
 *       and the list. Read with safeParse, since anything could be stored under the key.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { z } from "zod";
import { DRAFT_NAME_MAX, MAX_DRAFTS } from "@/constants/editor";

/** One draft: an id, a name, its text and when it last changed (ms since the epoch). */
export const draftSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().min(1).max(DRAFT_NAME_MAX),
  text: z.string(),
  updatedAt: z.number().int().nonnegative(),
});

/** One draft. */
export type Draft = z.infer<typeof draftSchema>;

/** Every draft and the open one's id, which is always one of them. */
export const draftStoreSchema = z
  .object({ activeId: z.string(), drafts: z.array(draftSchema).min(1).max(MAX_DRAFTS) })
  .refine((store) => store.drafts.some((draft) => draft.id === store.activeId));

/** Every draft and the open one's id. */
export type DraftStore = z.infer<typeof draftStoreSchema>;
