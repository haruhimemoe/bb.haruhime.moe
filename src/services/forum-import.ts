/**
 * @file src/services/forum-import.ts
 * @desc The Import tool's server side: the BBCode someone wrote on osu!, from a forum topic (its
 *       first post), a post in a topic, a post link (resolved by one HEAD to osu.ppy.sh, reading
 *       only where it redirects; no page is fetched or parsed), or a user's "me!" page. osu! API
 *       calls go through @haruhimemoe/osu within the caller's budget.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import "server-only";
import { parseForumUrl } from "@haruhimemoe/osu/shapes";
import { SERVER_USER_AGENT } from "@/constants/site";
import { getOsuClient } from "@/lib/osu";
import type { ImportRef } from "@/utils/import-ref";

const OSU = "https://osu.ppy.sh";
const HEAD_TIMEOUT_MS = 5000;

/** What was imported: where it came from and its BBCode. */
export type ForumImport = {
  source: { kind: "post" | "userpage"; title: string; url: string };
  bbcode: string;
};

/** A post link's redirect didn't lead to a topic, so its topic is unknown. */
export class UnresolvedPostError extends Error {}

/** osu.ppy.sh didn't answer the post link's HEAD. */
export class ForumUnavailableError extends Error {}

type Gate = () => Promise<boolean>;

/** The topic (and post) a post link redirects to, or null when osu! has no such post. */
const resolvePost = async (postId: number): Promise<{ topicId: number; postId: number } | null> => {
  const response = await fetch(`${OSU}/community/forums/posts/${postId}`, {
    method: "HEAD",
    redirect: "manual",
    headers: { "user-agent": SERVER_USER_AGENT },
    cache: "no-store",
    signal: AbortSignal.timeout(HEAD_TIMEOUT_MS),
  }).catch((cause: unknown) => {
    throw new ForumUnavailableError("osu! didn't answer the post link.", { cause });
  });
  if (response.status === 404) return null;
  const location = response.headers.get("location");
  if (response.status < 300 || response.status > 399 || !location) {
    throw new UnresolvedPostError(`osu! answered ${response.status} without a redirect.`);
  }
  let target: URL;
  try {
    target = new URL(location, OSU);
  } catch {
    throw new UnresolvedPostError("osu! redirected somewhere unreadable.");
  }
  const forum = parseForumUrl(target.href);
  if (!forum?.topicId || (forum.postId !== null && forum.postId !== postId)) {
    throw new UnresolvedPostError("osu! redirected somewhere that isn't the post's topic.");
  }
  return { topicId: forum.topicId, postId };
};

/** A topic's first post, or the post `postId` in it. */
const importPost = async (
  topicId: number,
  postId: number | null,
  beforeCall: Gate,
): Promise<ForumImport | null> => {
  const page = await getOsuClient().getForumTopic(topicId, {
    beforeCall,
    sort: "id_asc",
    limit: 1,
    ...(postId === null ? {} : { start: postId }),
  });
  const post = page?.posts[0];
  if (!page || !post?.body || (postId !== null && post.id !== postId)) return null;
  return {
    source: {
      kind: "post",
      title: page.topic.title,
      url: `${OSU}/community/forums/topics/${topicId}?start=${post.id}`,
    },
    bbcode: post.body.raw,
  };
};

/**
 * @function importFromRef
 * @param ref {Exclude<ImportRef, { kind: "invalid" }>} what to import (parseImportRef's answer)
 * @param beforeCall {() => Promise<boolean>} the osu! budget's gate
 * @returns {Promise<ForumImport | null>} the BBCode and its source, or null when there's no such
 *          post or user, the post was deleted, or the userpage is empty
 * @throws {UnresolvedPostError} when a post link doesn't redirect to its topic
 * @throws {ForumUnavailableError} when osu.ppy.sh doesn't answer a post link
 * @throws {OsuApiError} when the budget refuses (code "budget") or the osu! API fails
 */
export const importFromRef = async (
  ref: Exclude<ImportRef, { kind: "invalid" }>,
  beforeCall: Gate,
): Promise<ForumImport | null> => {
  if (ref.kind === "topic") return importPost(ref.topicId, null, beforeCall);
  if (ref.kind === "post") return importPost(ref.topicId, ref.postId, beforeCall);
  if (ref.kind === "post-only") {
    const found = await resolvePost(ref.postId);
    return found ? importPost(found.topicId, found.postId, beforeCall) : null;
  }
  const profile = await getOsuClient().getUserProfile(ref.user, { beforeCall });
  if (!profile?.page || profile.page.raw.trim() === "") return null;
  return {
    source: {
      kind: "userpage",
      title: `${profile.username}'s userpage`,
      url: `${OSU}/users/${profile.osuId}`,
    },
    bbcode: profile.page.raw,
  };
};
