/**
 * @file src/services/template-history-read.ts
 * @desc Reading and toggling a person's template's history. A template the caller can't see is a
 *       404; one they see but can't read the history of is a 403 `history_private`. A first read
 *       of a pre-history template creates its root, so the list is never empty. setTemplateHistoryPublic
 *       is owner only and writes nothing when the value doesn't change.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import "server-only";
import type { RevisionMeta } from "@haruhimemoe/vcs";
import { diffValue } from "@haruhimemoe/vcs/json";
import { templateRevisions } from "@/lib/template-revisions";
import { templatesCollection } from "@/models/Template";
import type { StoredTemplate } from "@/schemas/template";
import type { TemplateView } from "@/schemas/template-view";
import { ensureHistory } from "@/services/template-history";
import { type Owner, ownedTemplate } from "@/services/templates-update";
import { type Answer, accept, NOT_FOUND, refuse } from "@/utils/answer";
import { canView, type Viewer } from "@/utils/template-access";
import {
  type TemplateHistoryAccess,
  templateHistoryAccessOf,
} from "@/utils/template-history-access";
import { isBuiltinId } from "@/utils/template-ids";
import { TEMPLATE_CODEC, type TemplateSnapshot } from "@/utils/template-snapshot";
import { toTemplateView } from "@/utils/template-view";
import { findStoredTemplate } from "./templates-read";

const HISTORY_PAGE = 50;

/** The 403 message: the caller can see the template, not its history. */
export const HISTORY_PRIVATE = "This template's history is private.";

/** A page of a template's history. */
export type TemplateHistory = {
  template: { id: string; name: string };
  access: TemplateHistoryAccess;
  historyPublic: boolean;
  revisions: RevisionMeta[];
  older: number | null;
};

/** One revision, with its changes against the previous one. */
export type TemplateRevisionView = {
  revision: RevisionMeta;
  previous: RevisionMeta | null;
  before: TemplateSnapshot | null;
  after: TemplateSnapshot;
  changes: ReturnType<typeof diffValue>;
};

const readable = async (
  id: string,
  viewer: Viewer,
): Promise<Answer<{ stored: StoredTemplate; access: TemplateHistoryAccess }>> => {
  if (isBuiltinId(id)) return NOT_FOUND;
  const stored = await findStoredTemplate(id);
  if (!stored || !canView(stored, viewer)) return NOT_FOUND;
  const access = templateHistoryAccessOf(stored, viewer);
  if (!access.canRead) return refuse(403, "history_private", HISTORY_PRIVATE);
  await ensureHistory(stored);
  return accept({ stored, access });
};

/**
 * @function loadTemplateHistory
 * @param id {string} the template
 * @param viewer {Viewer} who asks
 * @param before {number | undefined} only revisions with a lower seq (paging)
 * @returns {Promise<Answer<TemplateHistory>>} a page of revisions, newest first
 */
export const loadTemplateHistory = async (
  id: string,
  viewer: Viewer,
  before?: number,
): Promise<Answer<TemplateHistory>> => {
  const loaded = await readable(id, viewer);
  if (!loaded.ok) return loaded;
  const { stored, access } = loaded.value;
  const revisions = await templateRevisions.list(id, { before, limit: HISTORY_PAGE });
  const older = revisions.length === HISTORY_PAGE ? (revisions.at(-1)?.seq ?? null) : null;
  return accept({
    template: { id: stored._id, name: stored.name },
    access,
    historyPublic: stored.historyPublic === true,
    revisions,
    older,
  });
};

/**
 * @function loadTemplateRevision
 * @param id {string} the template
 * @param viewer {Viewer} who asks
 * @param revisionId {string} the revision to show
 * @returns {Promise<Answer<TemplateRevisionView>>} the revision, the previous one (none for the
 *          root), and the changes between them
 */
export const loadTemplateRevision = async (
  id: string,
  viewer: Viewer,
  revisionId: string,
): Promise<Answer<TemplateRevisionView>> => {
  const loaded = await readable(id, viewer);
  if (!loaded.ok) return loaded;
  const revision = await templateRevisions.get(id, revisionId);
  if (!revision) return refuse(404, "revision_not_found", "That revision doesn't exist.");
  const [previousMeta] = await templateRevisions.list(id, { before: revision.seq, limit: 1 });
  const previous = previousMeta ? await templateRevisions.get(id, previousMeta.id) : null;
  const { value: after } = revision;
  const { value: _removed, ...meta } = revision;
  return accept({
    revision: meta,
    previous: previousMeta ?? null,
    before: previous?.value ?? null,
    after,
    changes: previous ? diffValue(previous.value, after, TEMPLATE_CODEC) : [],
  });
};

/**
 * @function setTemplateHistoryPublic
 * @param id {string} the template
 * @param viewer {Owner} the owner
 * @param historyPublic {boolean} the new value
 * @returns {Promise<Answer<TemplateView>>} the template, unchanged in the database when the
 *          value didn't change
 */
export const setTemplateHistoryPublic = async (
  id: string,
  viewer: Owner,
  historyPublic: boolean,
): Promise<Answer<TemplateView>> => {
  const owned = await ownedTemplate(id, viewer);
  if (!owned.ok) return owned;
  const stored = owned.value;
  await ensureHistory(stored);
  if (stored.historyPublic === historyPublic) return accept(toTemplateView(stored));
  const next = await (await templatesCollection()).findOneAndUpdate(
    { _id: id },
    { $set: { historyPublic } },
    { returnDocument: "after" },
  );
  return next ? accept(toTemplateView(next)) : NOT_FOUND;
};
