/**
 * @file src/utils/drafts.ts
 * @desc The editor's named drafts as plain data: read them from storage text, start a store,
 *       add, rename, delete, switch and edit a draft. Every function returns a new store and never
 *       leaves it without a draft or with an open id that isn't one of them. Pure: ids and times
 *       come in as arguments.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { DRAFT_NAME_MAX, MAX_DRAFTS } from "@/constants/editor";
import { type Draft, type DraftStore, draftStoreSchema } from "@/schemas/draft";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/**
 * @function newDraftId
 * @param random {(bytes: Uint8Array) => Uint8Array} fills bytes (default Web Crypto; tests)
 * @returns {string} `d-` and 10 base36 characters
 */
export const newDraftId = (
  random: (bytes: Uint8Array) => Uint8Array = (bytes) => crypto.getRandomValues(bytes),
): string => `d-${[...random(new Uint8Array(10))].map((b) => ALPHABET[b % 36]).join("")}`;

/**
 * @function parseDraftStore
 * @param raw {string | null} what storage holds under the drafts key
 * @returns {DraftStore | null} the drafts, or null when there are none or the text isn't a store
 */
export const parseDraftStore = (raw: string | null): DraftStore | null => {
  if (raw === null) return null;
  try {
    const parsed = draftStoreSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

/**
 * @function cleanDraftName
 * @param name {string} a typed name
 * @param fallback {string} used when the name is blank
 * @returns {string} the name on one line, trimmed and cut to DRAFT_NAME_MAX
 */
export const cleanDraftName = (name: string, fallback: string): string => {
  const clean = name.replace(/\s+/g, " ").trim().slice(0, DRAFT_NAME_MAX).trim();
  return clean === "" ? fallback : clean;
};

/**
 * @function nextDraftName
 * @param store {DraftStore | null} the drafts so far
 * @returns {string} "Draft N" with the first N no draft is named yet
 */
export const nextDraftName = (store: DraftStore | null): string => {
  const names = new Set(store?.drafts.map((draft) => draft.name));
  let n = (store?.drafts.length ?? 0) + 1;
  while (names.has(`Draft ${n}`)) n++;
  return `Draft ${n}`;
};

/**
 * @function startStore
 * @param id {string} the first draft's id
 * @param now {number} the time
 * @param text {string} its text (stage 1's draft when migrating)
 * @param name {string} its name
 * @returns {DraftStore} a store holding just that draft, open
 */
export const startStore = (id: string, now: number, text = "", name = "Draft 1"): DraftStore => ({
  activeId: id,
  drafts: [{ id, name, text, updatedAt: now }],
});

/**
 * @function activeDraft
 * @param store {DraftStore} the drafts
 * @returns {Draft} the open one
 */
export const activeDraft = (store: DraftStore): Draft =>
  store.drafts.find((draft) => draft.id === store.activeId) ?? (store.drafts[0] as Draft);

/**
 * @function addDraft
 * @param store {DraftStore} the drafts
 * @param draft {Draft} the new one
 * @returns {DraftStore} with the new draft first and open; the oldest drop off past MAX_DRAFTS
 */
export const addDraft = (store: DraftStore, draft: Draft): DraftStore => {
  const kept = [...store.drafts].sort((a, b) => b.updatedAt - a.updatedAt);
  return { activeId: draft.id, drafts: [draft, ...kept.slice(0, MAX_DRAFTS - 1)] };
};

/**
 * @function selectDraft
 * @param store {DraftStore} the drafts
 * @param id {string} the one to open
 * @returns {DraftStore} with it open, or unchanged when there's no such draft
 */
export const selectDraft = (store: DraftStore, id: string): DraftStore =>
  store.drafts.some((draft) => draft.id === id) ? { ...store, activeId: id } : store;

const change = (store: DraftStore, id: string, patch: Partial<Draft>): DraftStore => ({
  ...store,
  drafts: store.drafts.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)),
});

/**
 * @function renameDraft
 * @param store {DraftStore} the drafts
 * @param id {string} the draft
 * @param name {string} the typed name (a blank one keeps the old name)
 * @returns {DraftStore} with that draft renamed
 */
export const renameDraft = (store: DraftStore, id: string, name: string): DraftStore => {
  const draft = store.drafts.find((one) => one.id === id);
  return draft ? change(store, id, { name: cleanDraftName(name, draft.name) }) : store;
};

/**
 * @function setDraftText
 * @param store {DraftStore} the drafts
 * @param id {string} the draft
 * @param text {string} its new text
 * @param now {number} the time
 * @returns {DraftStore} with the text and time updated (the same store when the text is too)
 */
export const setDraftText = (
  store: DraftStore,
  id: string,
  text: string,
  now: number,
): DraftStore =>
  store.drafts.find((draft) => draft.id === id)?.text === text
    ? store
    : change(store, id, { text, updatedAt: now });

/**
 * @function deleteDraft
 * @param store {DraftStore} the drafts
 * @param id {string} the one to delete
 * @param freshId {string} the id of an empty draft to start when it was the last one
 * @param now {number} the time
 * @returns {DraftStore} without it; the most recently changed draft left opens in its place
 */
export const deleteDraft = (
  store: DraftStore,
  id: string,
  freshId: string,
  now: number,
): DraftStore => {
  const left = store.drafts.filter((draft) => draft.id !== id);
  if (left.length === 0) return startStore(freshId, now);
  if (store.activeId !== id) return { ...store, drafts: left };
  const latest = left.reduce((a, b) => (b.updatedAt > a.updatedAt ? b : a));
  return { activeId: latest.id, drafts: left };
};
