/**
 * @file src/services/template-history.ts
 * @desc A template's history plumbing. A template gets its root revision lazily (its content as
 *       it was, on the first save, history read or toggle after history shipped), and `head` on
 *       the row names the revision its content matches. The live row stays the authority: a
 *       save, revert or pull writes the live row only when the revision it should match is at
 *       least as new as what's already there (writeLive's guard), since a slower caller may have
 *       raced a faster one that read and wrote first.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import "server-only";
import type { RevisionAuthor } from "@haruhimemoe/next-kit/vcs";
import type { Revision, RevisionRef } from "@haruhimemoe/vcs";
import { templateRevisions } from "@/lib/template-revisions";
import { templatesCollection } from "@/models/Template";
import type { SessionUser } from "@/schemas/session-user";
import type { StoredTemplate } from "@/schemas/template";
import { snapshotOf, type TemplateSnapshot } from "@/utils/template-snapshot";

/** That pre-history root's message. */
export const HISTORY_START = "Saved before history was kept.";

/**
 * @function authorOf
 * @param user {Pick<SessionUser, "osuId" | "username">} the signed-in caller
 * @returns {RevisionAuthor} their osu! id (as a string: bb keys owners by osu! id) and name
 */
export const authorOf = (user: Pick<SessionUser, "osuId" | "username">): RevisionAuthor => ({
  id: String(user.osuId),
  name: user.username,
});

/**
 * @function refOf
 * @param revision {RevisionRef} a revision (or its ref)
 * @returns {RevisionRef} just its id and seq
 */
export const refOf = ({ id, seq }: RevisionRef): RevisionRef => ({ id, seq });

/**
 * @function setHead
 * @param id {string} the template
 * @param ref {RevisionRef} a revision just written
 * @returns {Promise<void>} once the row names it, unless the row already names a later one
 */
export const setHead = async (id: string, ref: RevisionRef): Promise<void> => {
  await (await templatesCollection()).updateOne(
    { _id: id, $or: [{ head: { $exists: false } }, { "head.seq": { $lt: ref.seq } }] },
    { $set: { head: ref } },
  );
};

const startHistory = async (
  stored: StoredTemplate,
  author: RevisionAuthor,
  message: string | null,
): Promise<Revision<TemplateSnapshot>> => {
  try {
    return await templateRevisions.create(stored._id, snapshotOf(stored), author, message);
  } catch (error) {
    // Two first reads at once: the other one made the root.
    const head = await templateRevisions.head(stored._id);
    if (head) return head;
    throw error;
  }
};

/**
 * @function ensureHistory
 * @param stored {StoredTemplate} the template as read
 * @param author {RevisionAuthor} who a new root is by (default the owner)
 * @param message {string | null} a new root's message (default HISTORY_START)
 * @returns {Promise<RevisionRef>} the revision the row's content matches, made now if the
 *          template had none
 */
export const ensureHistory = async (
  stored: StoredTemplate,
  author: RevisionAuthor = { id: String(stored.ownerOsuId), name: stored.ownerName },
  message: string | null = HISTORY_START,
): Promise<RevisionRef> => {
  if (stored.head) return stored.head;
  const head =
    (await templateRevisions.head(stored._id)) ?? (await startHistory(stored, author, message));
  await setHead(stored._id, refOf(head));
  return refOf(head);
};

/**
 * @function writeLive
 * @param stored {StoredTemplate} the row as read
 * @param revision {Revision<TemplateSnapshot>} the revision the row now matches
 * @param set {Partial<StoredTemplate>} other fields to set (visibility, hidden, forkOf)
 * @param now {Date} current time
 * @returns {Promise<StoredTemplate | null>} the row after, or null when a later revision is
 *          already on it (that one carries this revision's content: it merged onto it)
 */
export const writeLive = async (
  stored: StoredTemplate,
  revision: Revision<TemplateSnapshot>,
  set: Partial<StoredTemplate>,
  now: Date,
): Promise<StoredTemplate | null> =>
  (await templatesCollection()).findOneAndUpdate(
    {
      _id: stored._id,
      ownerOsuId: stored.ownerOsuId,
      $or: [{ head: { $exists: false } }, { "head.seq": { $lte: revision.seq } }],
    },
    {
      $set: { ...snapshotOf(revision.value), head: refOf(revision), ...set, updatedAt: now },
      $inc: { version: 1 },
    },
    { returnDocument: "after" },
  );
