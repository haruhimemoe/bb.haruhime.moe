/**
 * @file src/utils/player-names.ts
 * @desc The player list's text in and out. In: each pasted line is an osu! user id, a username,
 *       or a profile link (osu.ppy.sh/users/<id or name>, /u/..., with or without a mode);
 *       anything else is refused. Out: one line per user, a flag and [profile=id]name[/profile],
 *       as a numbered list, a bullet list or plain lines. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import type { FlagStyle } from "@haruhimemoe/bbcode/flags";
import { flag, list, profile } from "@haruhimemoe/bbcode/helpers";
import { MAX_PLAYER_NAME_LENGTH, type PlayerListStyle } from "@/constants/osu";

/** One line to look up: a user id, or a username. */
export type PlayerQuery = { kind: "id"; id: number } | { kind: "name"; name: string };

/** osu! usernames: letters, digits, spaces, `-`, `_`, `[` and `]`. */
const NAME = /^[A-Za-z0-9 _[\]-]+$/;
const PROFILE = /^(?:https?:\/\/)?(?:osu\.ppy\.sh|old\.ppy\.sh)\/(?:users|u)\/([^/?#]+)/i;
const MAX_ID = 2_147_483_647;

/**
 * @function parsePlayer
 * @param line {string} one pasted line
 * @returns {PlayerQuery | null} the id (digits only) or the name to look up, or null when the
 *          line is neither
 */
export const parsePlayer = (line: string): PlayerQuery | null => {
  const trimmed = line.trim();
  const fromLink = PROFILE.exec(trimmed)?.[1];
  const value = fromLink === undefined ? trimmed : decodeURIComponent(fromLink).trim();
  if (/^\d+$/.test(value)) {
    const id = Number(value);
    return id > 0 && id <= MAX_ID ? { kind: "id", id } : null;
  }
  if (value === "" || value.length > MAX_PLAYER_NAME_LENGTH || !NAME.test(value)) return null;
  return { kind: "name", name: value };
};

/**
 * @function queryKey
 * @param query {PlayerQuery} an id or a name
 * @returns {string} "id:2" or "name:peppy" (names in lower case, as osu! matches them)
 */
export const queryKey = (query: PlayerQuery): string =>
  query.kind === "id" ? `id:${query.id}` : `name:${query.name.toLowerCase()}`;

/**
 * @function playerLines
 * @param text {string} the pasted text
 * @returns {string[]} its lines, trimmed, blank ones left out
 */
export const playerLines = (text: string): string[] =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");

/** How the player list is written. */
export type PlayerListOptions = { style: PlayerListStyle; flags: FlagStyle | "none" };

/**
 * @function playerListBbcode
 * @param users {readonly { id: number; username: string; countryCode: string | null }[]} users
 *        in order
 * @param options {PlayerListOptions} the list style and the flag style (or none)
 * @returns {string} the BBCode: a flag (when there's a country), a space and the profile link
 *          per user; "" for no users
 */
export const playerListBbcode = (
  users: readonly { id: number; username: string; countryCode: string | null }[],
  { style, flags }: PlayerListOptions,
): string => {
  if (users.length === 0) return "";
  const items = users.map((user) => {
    const link = profile(user.id, user.username);
    return flags === "none" || user.countryCode === null
      ? link
      : `${flag(user.countryCode, { style: flags })} ${link}`;
  });
  if (style === "lines") return items.join("\n");
  return list(items, { ordered: style === "numbered" });
};

/** playerAnswer's result: the route's answer. */
export type PlayerAnswer = {
  users: { id: number; username: string; countryCode: string | null }[];
  notFound: string[];
  unchecked: string[];
};

/**
 * @function playerAnswer
 * @param names {readonly string[]} the lines as typed
 * @param found {ReadonlyMap<string, { id: number; username: string; countryCode: string | null } | null>}
 *        each query key's user, null when osu! has none, missing when it wasn't asked
 * @returns {PlayerAnswer} users in the order asked (each once), lines osu! has no user for (and
 *          lines that aren't a name or id), and lines that weren't asked
 */
export const playerAnswer = (
  names: readonly string[],
  found: ReadonlyMap<string, { id: number; username: string; countryCode: string | null } | null>,
): PlayerAnswer => {
  const answer: PlayerAnswer = { users: [], notFound: [], unchecked: [] };
  const seen = new Set<number>();
  for (const name of names) {
    const query = parsePlayer(name);
    const user = query ? found.get(queryKey(query)) : null;
    if (user === undefined) answer.unchecked.push(name);
    else if (user === null) answer.notFound.push(name);
    else if (!seen.has(user.id)) {
      seen.add(user.id);
      answer.users.push(user);
    }
  }
  return answer;
};
