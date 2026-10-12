/**
 * @file src/hooks/useSnippets.ts
 * @desc The Snippets tool's lists from GET /api/snippets: loaded when the tool opens, again
 *       after a save or an import (`reload`), with why not when they didn't load.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import type { SnippetLists } from "@/services/snippets";

/** What useSnippets returns. */
export type SnippetsState = {
  lists: SnippetLists | null;
  error: string | null;
  reload: () => void;
};

/**
 * @function useSnippets
 * @returns {SnippetsState} the lists (null while loading), the error, and reload
 */
export function useSnippets(): SnippetsState {
  const t = useTranslations("bb.snippets");
  const [lists, setLists] = useState<SnippetLists | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: `round` asks for a fresh load.
  useEffect(() => {
    let live = true;
    fetch("/api/snippets")
      .then(async (response) => {
        if (!live) return;
        if (!response.ok) return setError(t("failed", { status: response.status }));
        setLists((await response.json()) as SnippetLists);
        setError(null);
      })
      .catch(() => live && setError(t("offline")));
    return () => {
      live = false;
    };
  }, [round, t]);
  const reload = useCallback(() => setRound((n) => n + 1), []);
  return { lists, error, reload };
}
