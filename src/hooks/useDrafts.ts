/**
 * @file src/hooks/useDrafts.ts
 * @desc The editor's named drafts, kept in this browser. On load it reads the drafts (moving
 *       stage 1's single `bb:draft` in once, then removing it), and a template's "Use" hand-off
 *       becomes a new draft, opened. Every change is saved AUTOSAVE_DELAY_MS after the last one.
 *       Storage that's blocked or full never breaks typing (src/utils/storage.ts); `saved` says
 *       whether the last save landed.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AUTOSAVE_DELAY_MS,
  DRAFTS_KEY,
  HANDOFF_DRAFT_NAME,
  HANDOFF_KEY,
  LEGACY_DRAFT_KEY,
} from "@/constants/editor";
import type { Draft, DraftStore } from "@/schemas/draft";
import * as drafts from "@/utils/drafts";
import { readStored, takeStored, writeStored } from "@/utils/storage";

/** What useDrafts hands the editor. */
export type DraftsState = {
  /** Every draft and the open one's id (null until storage has been read). */
  store: DraftStore | null;
  /** The open draft (null until loaded). */
  active: Draft | null;
  /** Whether the last save reached storage (false when storage is blocked). */
  saved: boolean;
  /** True when the open draft came from a template's "Use" on this load. */
  fromTemplate: boolean;
  setText: (text: string) => void;
  create: () => void;
  select: (id: string) => void;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
};

/** Reads the stored drafts, moving stage 1's draft in, and adds a hand-off as a new draft. */
const load = (): { store: DraftStore; fromTemplate: boolean } => {
  const now = Date.now();
  let store = drafts.parseDraftStore(readStored(DRAFTS_KEY));
  if (!store) {
    const legacy = readStored(LEGACY_DRAFT_KEY);
    const name = legacy === null ? "Draft 1" : "My draft";
    store = drafts.startStore(drafts.newDraftId(), now, legacy ?? "", name);
    if (legacy !== null && writeStored(DRAFTS_KEY, JSON.stringify(store))) {
      takeStored(LEGACY_DRAFT_KEY);
    }
  }
  const handoff = takeStored(HANDOFF_KEY);
  if (handoff === null) return { store, fromTemplate: false };
  const id = drafts.newDraftId();
  const draft = { id, name: HANDOFF_DRAFT_NAME, text: handoff, updatedAt: now };
  return { store: drafts.addDraft(store, draft), fromTemplate: true };
};

/**
 * @function useDrafts
 * @returns {DraftsState} the drafts, the open one, the save state and the actions on them
 */
export function useDrafts(): DraftsState {
  const [store, setStore] = useState<DraftStore | null>(null);
  const [saved, setSaved] = useState(true);
  const [fromTemplate, setFromTemplate] = useState(false);
  const first = useRef(true);
  const echo = useRef(false);
  useEffect(() => {
    const loaded = load();
    setStore(loaded.store);
    setFromTemplate(loaded.fromTemplate);
  }, []);
  useEffect(() => {
    // Another tab saved: take its drafts (a template's "Use" there, say) so saving here doesn't
    // drop them. Only this tab's own changes are saved back, or two tabs would echo forever.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== DRAFTS_KEY) return;
      const incoming = drafts.parseDraftStore(event.newValue);
      if (!incoming) return;
      setStore((current) => {
        if (!current) return current;
        const next = drafts.adoptStore(current, incoming);
        echo.current = JSON.stringify(next.drafts) === JSON.stringify(incoming.drafts);
        return next;
      });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  useEffect(() => {
    if (!store) return;
    if (echo.current) {
      echo.current = false;
      return;
    }
    const save = () => setSaved(writeStored(DRAFTS_KEY, JSON.stringify(store)));
    if (first.current) {
      // The loaded store saves at once, so a hand-off is kept even if the tab closes.
      first.current = false;
      save();
      return;
    }
    const timer = setTimeout(save, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [store]);
  const update = useCallback((next: (current: DraftStore) => DraftStore) => {
    setStore((current) => (current ? next(current) : current));
  }, []);
  const setText = useCallback(
    (text: string) => update((s) => drafts.setDraftText(s, s.activeId, text, Date.now())),
    [update],
  );
  return {
    store,
    active: store ? drafts.activeDraft(store) : null,
    saved,
    fromTemplate,
    setText,
    create: () =>
      update((s) =>
        drafts.addDraft(s, {
          id: drafts.newDraftId(),
          name: drafts.nextDraftName(s),
          text: "",
          updatedAt: Date.now(),
        }),
      ),
    select: (id) => update((s) => drafts.selectDraft(s, id)),
    rename: (id, name) => update((s) => drafts.renameDraft(s, id, name)),
    remove: (id) => update((s) => drafts.deleteDraft(s, id, drafts.newDraftId(), Date.now())),
  };
}
