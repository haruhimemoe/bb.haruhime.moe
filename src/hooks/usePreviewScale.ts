/**
 * @file src/hooks/usePreviewScale.ts
 * @desc The preview's "Fit to pane" or "Actual size" choice, shared by every preview on the page
 *       and remembered in localStorage (src/utils/preview-scale.ts). It starts at "fit", as the
 *       server renders it, and takes the remembered choice after the first render.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { PREVIEW_SCALE_KEY } from "@/constants/editor";
import { loadScaleMode, type ScaleMode, saveScaleMode } from "@/utils/preview-scale";

/** The event that tells this page's other previews the choice changed. */
const CHANGED = "bb:preview-scale";

/**
 * @function usePreviewScale
 * @returns {[ScaleMode, (mode: ScaleMode) => void]} the choice and a setter that remembers it
 */
export const usePreviewScale = (): [ScaleMode, (mode: ScaleMode) => void] => {
  const [mode, setModeState] = useState<ScaleMode>("fit");
  useEffect(() => {
    const load = () => setModeState(loadScaleMode());
    const fromTab = (event: StorageEvent) => {
      if (event.key === PREVIEW_SCALE_KEY) load();
    };
    load();
    window.addEventListener(CHANGED, load);
    window.addEventListener("storage", fromTab);
    return () => {
      window.removeEventListener(CHANGED, load);
      window.removeEventListener("storage", fromTab);
    };
  }, []);
  const setMode = useCallback((next: ScaleMode) => {
    setModeState(next);
    saveScaleMode(next);
    window.dispatchEvent(new Event(CHANGED));
  }, []);
  return [mode, setMode];
};
