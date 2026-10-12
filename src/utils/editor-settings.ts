/**
 * @file src/utils/editor-settings.ts
 * @desc The source editor's settings, kept per browser: font (monospace or the site's sans),
 *       text size, auto-closed tags and list continuation. Read field by field, so one bad
 *       value falls back to its default without losing the rest. Pure, apart from the storage
 *       it's given.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { z } from "zod";
import { EDITOR_FONT_SIZES, EDITOR_FONTS, EDITOR_SETTINGS_KEY } from "@/constants/editor";
import { readStored, type StorageLike, writeStored } from "@/utils/storage";

/** One of the editor fonts. */
export type EditorFont = (typeof EDITOR_FONTS)[number];

/** The editor's settings. */
export type EditorSettings = {
  font: EditorFont;
  /** Text size in px, one of EDITOR_FONT_SIZES. */
  size: number;
  /** `]` writes the closing tag. */
  autoClose: boolean;
  /** Enter on a `[*]` item starts the next one. */
  listContinue: boolean;
};

/** What the editor starts with. */
export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  font: "mono",
  size: 14,
  autoClose: true,
  listContinue: true,
};

const FIELDS = {
  font: z.enum(EDITOR_FONTS),
  size: z.number().refine((size) => (EDITOR_FONT_SIZES as readonly number[]).includes(size)),
  autoClose: z.boolean(),
  listContinue: z.boolean(),
};

const field = <K extends keyof EditorSettings>(
  stored: Record<string, unknown>,
  key: K,
): EditorSettings[K] => {
  const parsed = FIELDS[key].safeParse(stored[key]);
  return (parsed.success ? parsed.data : DEFAULT_EDITOR_SETTINGS[key]) as EditorSettings[K];
};

/**
 * @function parseEditorSettings
 * @param stored {string | null} what storage holds
 * @returns {EditorSettings} the settings, each field its default when missing or bad
 */
export const parseEditorSettings = (stored: string | null): EditorSettings => {
  let value: unknown = null;
  try {
    value = stored ? JSON.parse(stored) : null;
  } catch {
    value = null;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return DEFAULT_EDITOR_SETTINGS;
  }
  const record = value as Record<string, unknown>;
  return {
    font: field(record, "font"),
    size: field(record, "size"),
    autoClose: field(record, "autoClose"),
    listContinue: field(record, "listContinue"),
  };
};

/**
 * @function loadEditorSettings
 * @param storage {StorageLike | null} where (default localStorage)
 * @returns {EditorSettings} the remembered settings, the defaults when there are none
 */
export const loadEditorSettings = (storage?: StorageLike | null): EditorSettings =>
  parseEditorSettings(readStored(EDITOR_SETTINGS_KEY, storage));

/**
 * @function saveEditorSettings
 * @param settings {EditorSettings} the settings
 * @param storage {StorageLike | null} where (default localStorage)
 * @returns {boolean} true when they were saved
 */
export const saveEditorSettings = (
  settings: EditorSettings,
  storage?: StorageLike | null,
): boolean => writeStored(EDITOR_SETTINGS_KEY, JSON.stringify(settings), storage);
