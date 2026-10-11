/**
 * @file src/utils/import-ref.ts
 * @desc What the Import tool was given: an osu! forum topic link (its first post), a topic link
 *       with ?start= (that post), a post link (/community/forums/posts/N, resolved on the server),
 *       a profile link by id or name, @ and an id, or a bare username. Bare digits are a
 *       username, since osu! lets names be numbers; @123 is the id. Pure, and safe in the browser.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { parseForumUrl } from "@haruhimemoe/osu/shapes";

/** One thing to import, or nothing usable. */
export type ImportRef =
  | { kind: "topic"; topicId: number }
  | { kind: "post"; topicId: number; postId: number }
  | { kind: "post-only"; postId: number }
  | { kind: "user"; user: number | string }
  | { kind: "invalid" };

const INVALID: ImportRef = { kind: "invalid" };
const OSU_HOSTS = new Set(["osu.ppy.sh", "old.ppy.sh"]);
/** osu!'s username rule: 3 to 15 of letters, digits, space, -, _, [ and ]. */
const USERNAME = /^[A-Za-z0-9 _[\]-]{3,15}$/;
const USER_PATH = /^\/(?:users|u)\/([^/]+)(?:\/(?:osu|taiko|fruits|mania))?\/?$/;
const AT_ID = /^@(\d+)$/;

/** A positive safe integer from digits, or null. */
const idOf = (digits: string): number | null => {
  const value = Number(digits);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
};

/** A profile path's user: an id for digits, otherwise a valid username. */
const userOf = (segment: string): ImportRef => {
  let decoded: string;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    return INVALID;
  }
  if (/^\d+$/.test(decoded)) {
    const id = idOf(decoded);
    return id ? { kind: "user", user: id } : INVALID;
  }
  return USERNAME.test(decoded) ? { kind: "user", user: decoded } : INVALID;
};

/** An osu! link: a forum topic or post, or a profile. */
const fromUrl = (url: URL): ImportRef => {
  if (!OSU_HOSTS.has(url.hostname)) return INVALID;
  const forum = parseForumUrl(url.href);
  if (forum) {
    if (forum.topicId === null) return { kind: "post-only", postId: forum.postId };
    return forum.postId === null
      ? { kind: "topic", topicId: forum.topicId }
      : { kind: "post", topicId: forum.topicId, postId: forum.postId };
  }
  const user = url.pathname.match(USER_PATH);
  return user?.[1] ? userOf(user[1]) : INVALID;
};

/**
 * @function parseImportRef
 * @param input {string} what was typed or pasted into the Import field
 * @returns {ImportRef} what to import, or `{ kind: "invalid" }`
 */
export const parseImportRef = (input: string): ImportRef => {
  const text = input.trim();
  if (/^https?:\/\//i.test(text)) {
    try {
      return fromUrl(new URL(text));
    } catch {
      return INVALID;
    }
  }
  const at = text.match(AT_ID);
  if (at?.[1]) {
    const id = idOf(at[1]);
    return id ? { kind: "user", user: id } : INVALID;
  }
  return USERNAME.test(text) ? { kind: "user", user: text } : INVALID;
};
