/**
 * @file src/services/template-upstream.ts
 * @desc A fork's relationship with what it copied. The base is `forkOf.rev`, the upstream
 *       revision this fork last took in; a fork from before fork refs (`rev: null`) gets one the
 *       first time its state is read, so only changes from then on are offered, never a sudden
 *       pile of "changes" from before fork refs shipped. The upstream must still be visible to
 *       the fork's owner, or it reads `gone` (deleted, made private, or hidden). Pulling is a
 *       3-way merge of the upstream's change onto the fork (mergeValue(base, ours, theirs)): a
 *       clean merge commits and moves the fork's base forward to the upstream's new head; a
 *       conflict writes nothing and hands the merged draft back, same shape as a save conflict
 *       (B4), so the fork owner resolves it the same way and the next PATCH's `pulled` moves the
 *       base once the resolving save lands (templates-update.ts's pulledFork).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import "server-only";
import { mergeValue } from "@haruhimemoe/vcs/json";
import { templateRevisions } from "@/lib/template-revisions";
import { templatesCollection } from "@/models/Template";
import type { StoredTemplate } from "@/schemas/template";
import type { TemplateView } from "@/schemas/template-view";
import { authorOf, ensureHistory, writeLive } from "@/services/template-history";
import {
  contentRefusal,
  type Owner,
  ownedTemplate,
  STALE_VERSION,
} from "@/services/templates-update";
import { type Answer, accept, refuse } from "@/utils/answer";
import { canView, type Viewer } from "@/utils/template-access";
import { isBuiltinId } from "@/utils/template-ids";
import { forkRefOf, TEMPLATE_CODEC } from "@/utils/template-snapshot";
import { toTemplateView } from "@/utils/template-view";
import { findStoredTemplate } from "./templates-read";

/** The 404 message: the fork's upstream is gone. */
export const UPSTREAM_GONE = "The template you copied isn't available any more.";
/** The 409 message: both sides changed the same lines. */
export const PULL_CONFLICT =
  "Your copy and the original changed the same places. The merged text is in the form with your version where they clash; check it and save.";

const UPSTREAM_UNAVAILABLE = refuse(404, "upstream_unavailable", UPSTREAM_GONE);

/** Where a fork stands against what it copied. */
export type UpstreamState =
  | { state: "none" }
  | { state: "gone" }
  | { state: "current"; upstream: { id: string; name: string } }
  | { state: "behind"; upstream: { id: string; name: string }; rev: string; changes: number };

/**
 * @function upstreamStateOf
 * @param stored {StoredTemplate} a fork (or any template: `none` for one that isn't)
 * @param viewer {Viewer} the fork's owner, reading their own edit page
 * @returns {Promise<UpstreamState>} none, gone, current, or behind with how many changes
 */
export const upstreamStateOf = async (
  stored: StoredTemplate,
  viewer: Viewer,
): Promise<UpstreamState> => {
  const ref = forkRefOf(stored.forkOf);
  if (!ref || isBuiltinId(ref.docId)) return { state: "none" };
  const upstream = await findStoredTemplate(ref.docId);
  if (!upstream || !canView(upstream, viewer)) return { state: "gone" };
  const named = { id: upstream._id, name: upstream.name };
  if (!ref.rev) {
    const head = await ensureHistory(upstream);
    // A legacy fork (a bare id): give it a starting point, guarded on forkOf still being that
    // bare id so a race with a pull doesn't step on a newer rev.
    await (await templatesCollection()).updateOne(
      { _id: stored._id, forkOf: ref.docId },
      { $set: { forkOf: { ...ref, rev: head.id } } },
    );
    return { state: "current", upstream: named };
  }
  const head = await templateRevisions.head(ref.docId);
  if (!head) return { state: "gone" };
  if (head.id === ref.rev) return { state: "current", upstream: named };
  const changes = (await templateRevisions.diff(ref.docId, ref.rev, head.id))?.length ?? 0;
  return { state: "behind", upstream: named, rev: head.id, changes };
};

/**
 * @function pullUpstream
 * @param id {string} the fork
 * @param viewer {Owner} the fork's owner
 * @param now {Date} current time (tests)
 * @returns {Promise<Answer<TemplateView>>} the fork with the upstream's changes merged in, a 404
 *          when the upstream is gone, a 409 `pull_conflict` with a draft to resolve, or today's
 *          stale-version 409
 */
export const pullUpstream = async (
  id: string,
  viewer: Owner,
  now: Date = new Date(),
): Promise<Answer<TemplateView>> => {
  const owned = await ownedTemplate(id, viewer);
  if (!owned.ok) return owned;
  const stored = owned.value;
  const ref = forkRefOf(stored.forkOf);
  const upstream = ref && !isBuiltinId(ref.docId) ? await findStoredTemplate(ref.docId) : null;
  if (!ref?.rev || !upstream || !canView(upstream, viewer)) return UPSTREAM_UNAVAILABLE;
  const [base, theirs, oursRef] = await Promise.all([
    templateRevisions.get(upstream._id, ref.rev),
    templateRevisions.head(upstream._id),
    ensureHistory(stored),
  ]);
  if (!base || !theirs) return UPSTREAM_UNAVAILABLE;
  if (theirs.id === base.id) return accept(toTemplateView(stored));
  const ours = await templateRevisions.get(id, oursRef.id);
  if (!ours) return refuse(409, "conflict", STALE_VERSION, toTemplateView(stored));
  const merge = mergeValue(base.value, ours.value, theirs.value, TEMPLATE_CODEC);
  if (!merge.clean) {
    return refuse(409, "pull_conflict", PULL_CONFLICT, toTemplateView(stored), {
      conflicts: merge.conflicts.map(({ path, kind }) => ({ path, kind })),
      draft: merge.value,
      pulled: theirs.id,
    });
  }
  let result: Awaited<ReturnType<typeof templateRevisions.commit>>;
  try {
    result = await templateRevisions.commit({
      docId: id,
      base: oursRef,
      value: merge.value,
      author: authorOf(viewer),
      message: `Pulled from ${upstream.name}`,
    });
  } catch (error) {
    return contentRefusal(error);
  }
  if (result.status === "conflict" || result.status === "missing")
    return refuse(409, "conflict", STALE_VERSION, toTemplateView(stored));
  const forkOf = { docId: upstream._id, rev: theirs.id };
  const next = await writeLive(stored, result.revision, { forkOf }, now);
  return next
    ? accept(toTemplateView(next))
    : refuse(409, "conflict", STALE_VERSION, toTemplateView(stored));
};
