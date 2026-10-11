/**
 * @file src/hooks/usePlayerLookup.ts
 * @desc Asks POST /api/osu/users for the player list and the collab maker: busy while it runs,
 *       the answer (checked with its schema) when it comes, or the error's message. The route
 *       takes at most 64 lines; more is refused here before anything is sent.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { MAX_PLAYER_NAMES } from "@/constants/osu";
import { type PlayerLookupAnswer, playerLookupAnswerSchema } from "@/schemas/osu-users";
import { errorMessageOf, sendJson } from "@/utils/api-client";

/** What usePlayerLookup returns. */
export type PlayerLookup = {
  busy: boolean;
  error: string | null;
  answer: PlayerLookupAnswer | null;
  /** Looks the names up; resolves to the answer, or null when it failed. */
  lookup: (names: readonly string[]) => Promise<PlayerLookupAnswer | null>;
};

/**
 * @function usePlayerLookup
 * @returns {PlayerLookup} the lookup's state and the function that runs it
 */
export function usePlayerLookup(): PlayerLookup {
  const t = useTranslations("bb.lookup");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<PlayerLookupAnswer | null>(null);
  const lookup = async (names: readonly string[]) => {
    setAnswer(null);
    if (names.length === 0) {
      setError(t("empty"));
      return null;
    }
    if (names.length > MAX_PLAYER_NAMES) {
      setError(t("tooMany", { count: names.length, max: MAX_PLAYER_NAMES }));
      return null;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await sendJson("/api/osu/users", "POST", { names });
      if (!response.ok) {
        setError(await errorMessageOf(response, t("failed")));
        return null;
      }
      const parsed = playerLookupAnswerSchema.safeParse(await response.json());
      if (!parsed.success) {
        setError(t("unreadable"));
        return null;
      }
      setAnswer(parsed.data);
      return parsed.data;
    } catch {
      setError(t("offline"));
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, answer, lookup };
}
