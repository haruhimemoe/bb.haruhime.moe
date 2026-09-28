/**
 * @file src/utils/storage.ts
 * @desc Browser storage that never throws: localStorage can be missing (server render), blocked
 *       (private windows, site data off) or full, and every read and write here is wrapped so
 *       the page works without it. The draft and the "Use" hand-off live under
 *       src/constants/editor.ts's keys.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

/** The parts of Storage used here (tests pass their own). */
export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/**
 * @function browserStorage
 * @returns {StorageLike | null} window.localStorage, or null when there is none or it's blocked
 */
export const browserStorage = (): StorageLike | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

/**
 * @function readStored
 * @param key {string} the key
 * @param storage {StorageLike | null} where (default localStorage)
 * @returns {string | null} the stored text, or null when there's none or storage fails
 */
export const readStored = (
  key: string,
  storage: StorageLike | null = browserStorage(),
): string | null => {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

/**
 * @function writeStored
 * @param key {string} the key
 * @param value {string} the text
 * @param storage {StorageLike | null} where (default localStorage)
 * @returns {boolean} true when it was saved
 */
export const writeStored = (
  key: string,
  value: string,
  storage: StorageLike | null = browserStorage(),
): boolean => {
  try {
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

/**
 * @function takeStored
 * @param key {string} the key
 * @param storage {StorageLike | null} where (default localStorage)
 * @returns {string | null} the stored text, removed as it's read (a hand-off is used once)
 */
export const takeStored = (
  key: string,
  storage: StorageLike | null = browserStorage(),
): string | null => {
  const value = readStored(key, storage);
  try {
    if (value !== null) storage?.removeItem(key);
  } catch {
    // Left behind: the next load takes it again, which is harmless.
  }
  return value;
};
