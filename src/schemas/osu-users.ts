/**
 * @file src/schemas/osu-users.ts
 * @desc POST /api/osu/users: the body (1 to 64 names or ids, one per entry) and the answer (the
 *       users osu! knows, in the order asked; the names it doesn't; the ones we couldn't ask
 *       about this time), shared by the route and the browser.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { z } from "zod";
import { MAX_PLAYER_NAME_LENGTH, MAX_PLAYER_NAMES } from "@/constants/osu";

/** The lookup's body: names, ids or profile links, as typed. */
export const playerLookupBodySchema = z
  .object({
    names: z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(MAX_PLAYER_NAME_LENGTH * 4),
      )
      .min(1)
      .max(MAX_PLAYER_NAMES),
  })
  .strict();

/** An osu! user as the player list needs it. */
export const playerUserSchema = z.object({
  id: z.number().int().positive(),
  username: z.string().min(1),
  countryCode: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .nullable(),
});

/** An osu! user as the player list needs it. */
export type PlayerUser = z.infer<typeof playerUserSchema>;

/** The lookup's answer. */
export const playerLookupAnswerSchema = z.object({
  /** Found users, in the order asked, each once. */
  users: z.array(playerUserSchema),
  /** What osu! has no user for, as typed. */
  notFound: z.array(z.string()),
  /** What we couldn't ask osu! about this time (the call budget ran out), as typed. */
  unchecked: z.array(z.string()),
});

/** The lookup's answer. */
export type PlayerLookupAnswer = z.infer<typeof playerLookupAnswerSchema>;
