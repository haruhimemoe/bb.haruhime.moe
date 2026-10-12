/**
 * @file src/utils/recents.ts
 * @desc Recently used picks for the flag and emoji pickers: newest first, each once, capped, and
 *       kept in browser storage as a JSON list of strings (anything else reads as none). Pure,
 *       apart from the storage it's given.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { readStored, type StorageLike, writeStored } from "@/utils/storage";

/**
 * @function pushRecent
 * @param list {readonly string[]} the recents, newest first
 * @param item {string} what was just used
 * @param max {number} how many to keep
 * @returns {string[]} the item first, then the rest without it, at most `max`
 */
export const pushRecent = (list: readonly string[], item: string, max: number): string[] =>
  [item, ...list.filter((one) => one !== item)].slice(0, max);

/**
 * @function loadRecents
 * @param key {string} the storage key
 * @param max {number} how many to keep
 * @param storage {StorageLike | null} where (default localStorage)
 * @returns {string[]} the stored recents, or none when missing or not a list of strings
 */
export const loadRecents = (key: string, max: number, storage?: StorageLike | null): string[] => {
  try {
    const value: unknown = JSON.parse(readStored(key, storage) ?? "[]");
    if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) return [];
    return value.slice(0, max);
  } catch {
    return [];
  }
};

/**
 * @function saveRecents
 * @param key {string} the storage key
 * @param list {readonly string[]} the recents
 * @param storage {StorageLike | null} where (default localStorage)
 * @returns {boolean} true when they were saved
 */
export const saveRecents = (
  key: string,
  list: readonly string[],
  storage?: StorageLike | null,
): boolean => writeStored(key, JSON.stringify(list), storage);
