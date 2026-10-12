/**
 * @file tests/unit/utils/editor-settings.test.ts
 * @desc Editor settings in storage: defaults when nothing or junk is stored, each good field kept
 *       when others are bad, and a save that reads back.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { describe, expect, it } from "vitest";
import {
  DEFAULT_EDITOR_SETTINGS,
  loadEditorSettings,
  parseEditorSettings,
  saveEditorSettings,
} from "@/utils/editor-settings";
import type { StorageLike } from "@/utils/storage";

const memory = (): StorageLike => {
  const items = new Map<string, string>();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
    removeItem: (key) => void items.delete(key),
  };
};

describe("parseEditorSettings", () => {
  it.each([null, "", "nope", "[]", "42"])("gives the defaults for %j", (stored) => {
    expect(parseEditorSettings(stored)).toEqual(DEFAULT_EDITOR_SETTINGS);
  });

  it("keeps the good fields and drops the bad ones", () => {
    const stored = JSON.stringify({ font: "sans", size: 99, autoClose: false, listContinue: "x" });
    expect(parseEditorSettings(stored)).toEqual({
      ...DEFAULT_EDITOR_SETTINGS,
      font: "sans",
      autoClose: false,
    });
  });
});

describe("loadEditorSettings and saveEditorSettings", () => {
  it("reads back what was saved", () => {
    const storage = memory();
    expect(loadEditorSettings(storage)).toEqual(DEFAULT_EDITOR_SETTINGS);
    const changed = { ...DEFAULT_EDITOR_SETTINGS, size: 18, listContinue: false };
    expect(saveEditorSettings(changed, storage)).toBe(true);
    expect(loadEditorSettings(storage)).toEqual(changed);
  });

  it("falls back to the defaults without storage", () => {
    expect(loadEditorSettings(null)).toEqual(DEFAULT_EDITOR_SETTINGS);
    expect(saveEditorSettings(DEFAULT_EDITOR_SETTINGS, null)).toBe(false);
  });
});
