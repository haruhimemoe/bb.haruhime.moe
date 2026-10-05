/**
 * @file src/services/templates-update.ts
 * @desc Changing and deleting a template, owner only. A content change names the revision it
 *       started from (`base`); it's laid on that revision and committed. Two tabs editing
 *       different lines merge; the same lines conflict (409 `merge_conflict`, with the merge's
 *       draft and conflicts, so the form can show it). A visibility-only PATCH needs no `base`:
 *       it writes the row directly when `baseVersion` is current, a stale one is today's 409. A
 *       body today's content rules refuse is a 400 with its code; the row isn't touched. Built-in
 *       templates are refused; a template the caller can't see is a 404, one they see but don't
 *       own a 403. Deleting also deletes its reports and its history.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

import "server-only";
import type { RevisionAuthor } from "@haruhimemoe/next-kit/vcs";
import type { Revision, RevisionRef } from "@haruhimemoe/vcs";
import { z } from "zod";
import { REPORTS_TO_HIDE } from "@/constants/templates";
import { templateRevisions } from "@/lib/template-revisions";
import { templateReportsCollection, templatesCollection } from "@/models/Template";
import type { StoredTemplate, TemplateContent, TemplatePatch } from "@/schemas/template";
import type { TemplateView } from "@/schemas/template-view";
import { authorOf, ensureHistory, writeLive } from "@/services/template-history";
import { type Answer, accept, BUILT_IN, NOT_FOUND, NOT_OWNER, refuse } from "@/utils/answer";
import { canView, isOwner, shouldHide, type Viewer } from "@/utils/template-access";
import { isBuiltinId } from "@/utils/template-ids";
import type { TemplateSnapshot } from "@/utils/template-snapshot";
import { toTemplateView } from "@/utils/template-view";
import { findStoredTemplate } from "./templates-read";

/** The 409 message: someone changed it first. */
export const STALE_VERSION =
  "This template changed since you opened it. It's reloaded; your change wasn't saved.";

/** The 409 message: the same lines changed in both places. */
export const MERGE_CONFLICT =
  "This template changed since you opened it, in the same places you changed. Your version is in the form; check it and save again.";

const CONTENT_KEYS = ["name", "description", "kind", "body", "fields"] as const;

const contentOf = (change: Partial<TemplateContent>): Partial<TemplateContent> =>
  Object.fromEntries(
    CONTENT_KEYS.flatMap((key) => (change[key] === undefined ? [] : [[key, change[key]]])),
  );

/**
 * @function ownedTemplate
 * @param id {string} the template id
 * @param viewer {NonNullable<Viewer>} the caller
 * @returns {Promise<Answer<StoredTemplate>>} the row when the caller owns it, else the refusal
 */
export const ownedTemplate = async (
  id: string,
  viewer: NonNullable<Viewer>,
): Promise<Answer<StoredTemplate>> => {
  if (isBuiltinId(id)) return BUILT_IN;
  const stored = await findStoredTemplate(id);
  if (!stored || !canView(stored, viewer)) return NOT_FOUND;
  return isOwner(stored, viewer) ? accept(stored) : NOT_OWNER;
};

const viewAt = (stored: StoredTemplate, head: Revision<TemplateSnapshot>): TemplateView => ({
  ...toTemplateView(stored),
  ...head.value,
  head: { id: head.id, seq: head.seq },
});

/**
 * @function contentRefusal
 * @param error {unknown} what commit, revert or pull threw
 * @returns {Refusal} a 400 with the content filter's code, or a 413 when it's too large
 * @throws {unknown} anything else, unchanged
 */
export const contentRefusal = (error: unknown) => {
  if (error instanceof z.ZodError) {
    const issue = error.issues[0];
    const code = issue?.code === "custom" ? issue.params?.code : undefined;
    return refuse(
      400,
      typeof code === "string" ? code : "bad_request",
      issue?.message ?? "That change fails today's rules.",
    );
  }
  if (error instanceof RangeError) {
    return refuse(413, "too_large", "That template is too large.");
  }
  throw error;
};

/**
 * @function commitContent
 * @param stored {StoredTemplate} the row as read
 * @param base {RevisionRef} the revision the client started from
 * @param change {Partial<TemplateContent>} what it changed
 * @param author {RevisionAuthor} the owner
 * @returns {Promise<Answer<Revision<TemplateSnapshot>>>} the revision the row should match, or a
 *          refusal (409 `merge_conflict` with draft and conflicts, 409 stale, 400 content rules)
 */
export const commitContent = async (
  stored: StoredTemplate,
  base: RevisionRef,
  change: Partial<TemplateContent>,
  author: RevisionAuthor,
): Promise<Answer<Revision<TemplateSnapshot>>> => {
  const from = await templateRevisions.get(stored._id, base.id);
  if (!from) return refuse(409, "conflict", STALE_VERSION, toTemplateView(stored));
  let result: Awaited<ReturnType<typeof templateRevisions.commit>>;
  try {
    result = await templateRevisions.commit({
      docId: stored._id,
      base,
      value: { ...from.value, ...change },
      author,
    });
  } catch (error) {
    return contentRefusal(error);
  }
  switch (result.status) {
    case "committed":
    case "merged":
    case "unchanged":
      return accept(result.revision);
    case "conflict":
      return refuse(409, "merge_conflict", MERGE_CONFLICT, viewAt(stored, result.head), {
        conflicts: result.merged.conflicts.map(({ path, kind }) => ({ path, kind })),
        draft: result.merged.value,
      });
    case "missing":
      return refuse(409, "conflict", STALE_VERSION, toTemplateView(stored));
  }
};

/**
 * @function pulledFork
 * @param _stored {StoredTemplate} the row as read
 * @param _pulled {string | undefined} the upstream revision a pull merged in (PATCH's `pulled`)
 * @returns {Promise<Record<string, unknown> | null>} fields to set on the row (B6), null until
 *          then
 */
const pulledFork = async (
  _stored: StoredTemplate,
  _pulled: string | undefined,
): Promise<Partial<StoredTemplate> | null> => null;

/**
 * @function updateTemplate
 * @param id {string} the template id
 * @param viewer {NonNullable<Viewer> & { username: string }} the caller (needs a username to
 *        author a revision)
 * @param patch {TemplatePatch} the base version, the content revision base, what changes and an
 *        upstream pull to land
 * @param now {Date} current time (tests)
 * @returns {Promise<Answer<TemplateView>>} the changed template, or a refusal
 */
export const updateTemplate = async (
  id: string,
  viewer: NonNullable<Viewer> & { username: string },
  { baseVersion, base, pulled, ...change }: TemplatePatch,
  now: Date = new Date(),
): Promise<Answer<TemplateView>> => {
  const owned = await ownedTemplate(id, viewer);
  if (!owned.ok) return owned;
  const stored = owned.value;
  const head = await ensureHistory(stored);
  const from = base ?? (stored.version === baseVersion ? head : null);
  if (!from) return refuse(409, "conflict", STALE_VERSION, toTemplateView(stored));
  const committed = await commitContent(stored, from, contentOf(change), authorOf(viewer));
  if (!committed.ok) return committed;
  const visibility = change.visibility ?? stored.visibility;
  const hidden = stored.hidden || shouldHide(visibility, stored.reports, REPORTS_TO_HIDE);
  const forkSet = await pulledFork(stored, pulled);
  const next = await writeLive(
    stored,
    committed.value,
    { visibility, hidden, ...(forkSet ?? {}) },
    now,
  );
  if (next) return accept(toTemplateView(next));
  const current = await findStoredTemplate(id);
  return current ? accept(toTemplateView(current)) : NOT_FOUND;
};

/**
 * @function deleteTemplate
 * @param id {string} the template id
 * @param viewer {NonNullable<Viewer>} the caller
 * @returns {Promise<Answer<null>>} null once it, its reports and its history are gone, or a
 *          refusal
 */
export const deleteTemplate = async (
  id: string,
  viewer: NonNullable<Viewer>,
): Promise<Answer<null>> => {
  const owned = await ownedTemplate(id, viewer);
  if (!owned.ok) return owned;
  const templates = await templatesCollection();
  const { deletedCount } = await templates.deleteOne({ _id: id, ownerOsuId: viewer.osuId });
  if (deletedCount === 0) return NOT_FOUND;
  await (await templateReportsCollection()).deleteMany({ templateId: id });
  await templateRevisions.removeDoc(id);
  return accept(null);
};
