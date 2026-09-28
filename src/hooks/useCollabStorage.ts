/**
 * @file src/hooks/useCollabStorage.ts
 * @desc Keeps the collab maker's image and regions in localStorage (src/utils/collab-storage.ts):
 *       restores them once after the first render (so the server's HTML and the first client
 *       render match), saves every change after that, and clears them on request.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { type Dispatch, useCallback, useEffect, useState } from "react";
import { type CollabAction, type CollabState, EMPTY_COLLAB } from "@/utils/collab";
import { clearCollab, loadCollab, saveCollab } from "@/utils/collab-storage";

/**
 * @function useCollabStorage
 * @param state {CollabState} the collab as it stands
 * @param dispatch {Dispatch<CollabAction>} the maker's reducer dispatch
 * @param newId {() => string} a fresh region id (stable across renders)
 * @returns {{ restored: boolean; clear: () => void }} whether the saved copy was restored this
 *          load, and a clear that empties the maker and forgets the saved copy
 */
export const useCollabStorage = (
  state: CollabState,
  dispatch: Dispatch<CollabAction>,
  newId: () => string,
): { restored: boolean; clear: () => void } => {
  const [loaded, setLoaded] = useState(false);
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    const saved = loadCollab(newId);
    if (saved) dispatch({ type: "load", state: saved });
    setRestored(saved !== null);
    setLoaded(true);
  }, [dispatch, newId]);
  useEffect(() => {
    if (loaded) saveCollab(state);
  }, [loaded, state]);
  const clear = useCallback(() => {
    clearCollab();
    setRestored(false);
    dispatch({ type: "load", state: EMPTY_COLLAB });
  }, [dispatch]);
  return { restored, clear };
};
