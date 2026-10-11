/**
 * @file src/schemas/forum-import.ts
 * @desc What bb's GET /api/osu/import answers (the BBCode and where it came from), checked again
 *       in the browser before the Import tool shows it.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { z } from "zod";

/** GET /api/osu/import's 200 answer. */
export const forumImportSchema = z.object({
  source: z.object({
    kind: z.enum(["post", "userpage"]),
    title: z.string(),
    url: z.url(),
  }),
  bbcode: z.string(),
});

/** One imported post or userpage. */
export type ForumImportAnswer = z.infer<typeof forumImportSchema>;
