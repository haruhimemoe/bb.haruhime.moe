/**
 * @file src/hooks/useEditorSettings.ts
 * @desc The source editor's settings (src/utils/editor-settings.ts), remembered in localStorage.
 *       They start at the defaults, as the server renders, and take the remembered ones after the
 *       first render; a change in another tab follows.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { EDITOR_SETTINGS_KEY } from "@/constants/editor";
import {
  DEFAULT_EDITOR_SETTINGS,
  type EditorSettings,
  loadEditorSettings,
  saveEditorSettings,
} from "@/utils/editor-settings";

/**
 * @function useEditorSettings
 * @returns {[EditorSettings, (next: EditorSettings) => void]} the settings and a setter that
 *          remembers them
 */
export const useEditorSettings = (): [EditorSettings, (next: EditorSettings) => void] => {
  const [settings, setState] = useState<EditorSettings>(DEFAULT_EDITOR_SETTINGS);
  useEffect(() => {
    const fromTab = (event: StorageEvent) => {
      if (event.key === EDITOR_SETTINGS_KEY) setState(loadEditorSettings());
    };
    setState(loadEditorSettings());
    window.addEventListener("storage", fromTab);
    return () => window.removeEventListener("storage", fromTab);
  }, []);
  const setSettings = useCallback((next: EditorSettings) => {
    setState(next);
    saveEditorSettings(next);
  }, []);
  return [settings, setSettings];
};
