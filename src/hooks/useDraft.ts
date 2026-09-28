/**
 * @file src/hooks/useDraft.ts
 * @desc The editor's text, kept in the browser. On load it takes the hand-off a template's
 *       "Use" left (and removes it), or else the autosaved draft; every change is saved again
 *       AUTOSAVE_DELAY_MS after typing stops. Storage that's blocked or full never breaks
 *       typing (src/utils/storage.ts); `saved` says whether the last save landed.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { AUTOSAVE_DELAY_MS, DRAFT_KEY, HANDOFF_KEY } from "@/constants/editor";
import { readStored, takeStored, writeStored } from "@/utils/storage";

/** What useDraft hands the editor. */
export type Draft = {
  text: string;
  setText: (text: string) => void;
  /** False until the stored text has been read (the textarea waits for it). */
  loaded: boolean;
  /** Whether the last save reached storage (false when storage is blocked). */
  saved: boolean;
  /** True when the text came from a template's "Use". */
  fromTemplate: boolean;
};

/**
 * @function useDraft
 * @returns {Draft} the text, its setter, and the load and save state
 */
export function useDraft(): Draft {
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(true);
  const [fromTemplate, setFromTemplate] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    const handoff = takeStored(HANDOFF_KEY);
    if (handoff !== null) {
      setText(handoff);
      setFromTemplate(true);
    } else {
      setText(readStored(DRAFT_KEY) ?? "");
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    if (first.current) {
      // The loaded text saves at once, so a hand-off becomes the draft.
      first.current = false;
      setSaved(writeStored(DRAFT_KEY, text));
      return;
    }
    const timer = setTimeout(() => setSaved(writeStored(DRAFT_KEY, text)), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text, loaded]);
  return { text, setText, loaded, saved, fromTemplate };
}
