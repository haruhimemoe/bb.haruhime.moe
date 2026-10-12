/**
 * @file src/services/template-proposal-merge.ts
 * @desc Deciding on a proposal (src/services/template-proposals.ts). Merging 3-way merges the
 *       proposal onto the template's head from the revision it started from, the owner's head as
 *       "ours": a clean merge commits on the head, credited to the proposer in the revision's
 *       message; an overlap writes nothing and hands back the merged draft with the owner's
 *       version where they clash (409 `proposal_conflict`), plus the proposal's id and version,
 *       which the owner's resolving save names (PATCH's `merged`) to close it, but only if the
 *       proposal hasn't changed since. The owner can decline; the proposer can withdraw.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import "server-only";
import { mergeValue } from "@haruhimemoe/vcs/json";
import { templateRevisions } from "@/lib/template-revisions";
import { templateProposalsCollection } from "@/models/Template";
import type { TemplateView } from "@/schemas/template-view";
import { closeProposal } from "@/services/proposal-close";
import { authorOf, ensureHistory, refOf, writeLive } from "@/services/template-history";
import {
  contentRefusal,
  type Owner,
  ownedTemplate,
  STALE_VERSION,
} from "@/services/templates-update";
import { type Answer, accept, refuse } from "@/utils/answer";
import type { Viewer } from "@/utils/template-access";
import { TEMPLATE_CODEC } from "@/utils/template-snapshot";
import { toTemplateView } from "@/utils/template-view";
import { findStoredTemplate } from "./templates-read";

/** The 409 message: the proposal and the owner's changes touch the same lines. */
export const PROPOSAL_CONFLICT =
  "This proposal and your own changes touch the same places. The merged text is in the form with your version where they clash; check it and save.";

const NOT_PROPOSER = refuse(403, "forbidden", "Only the person who proposed it can withdraw it.");
const PROPOSAL_GONE = refuse(404, "proposal_not_found", "That proposal isn't open any more.");

/**
 * @function mergeProposal
 * @param templateId {string} the upstream template
 * @param proposalId {string} the proposal
 * @param viewer {Owner} the upstream's owner
 * @param now {Date} current time (tests)
 * @returns {Promise<Answer<TemplateView>>} the template with the proposal merged in; a 409
 *          `proposal_conflict` with the merged draft to resolve; 404 for a proposal not open
 */
export const mergeProposal = async (
  templateId: string,
  proposalId: string,
  viewer: Owner,
  now: Date = new Date(),
): Promise<Answer<TemplateView>> => {
  const owned = await ownedTemplate(templateId, viewer);
  if (!owned.ok) return owned;
  const stored = owned.value;
  const proposals = await templateProposalsCollection();
  const proposal = await proposals.findOne({ _id: proposalId, templateId, status: "open" });
  if (!proposal) return PROPOSAL_GONE;
  const headRef = await ensureHistory(stored);
  const [base, head] = await Promise.all([
    templateRevisions.get(templateId, proposal.base),
    templateRevisions.get(templateId, headRef.id),
  ]);
  if (!base) return PROPOSAL_GONE;
  if (!head) return refuse(409, "conflict", STALE_VERSION, toTemplateView(stored));
  // The owner's head is "ours", so where both changed the same place their version stays.
  const merge = mergeValue(base.value, head.value, proposal.value, TEMPLATE_CODEC);
  if (!merge.clean) {
    return refuse(409, "proposal_conflict", PROPOSAL_CONFLICT, toTemplateView(stored), {
      conflicts: merge.conflicts.map(({ path, kind }) => ({ path, kind })),
      draft: merge.value,
      merged: { id: proposalId, at: proposal.updatedAt.getTime() },
    });
  }
  const note = proposal.message ? `: ${proposal.message}` : "";
  let result: Awaited<ReturnType<typeof templateRevisions.commit>>;
  try {
    result = await templateRevisions.commit({
      docId: templateId,
      base: refOf(head),
      value: merge.value,
      author: authorOf(viewer),
      message: `Merged ${proposal.proposer.username}'s proposal${note}`,
    });
  } catch (error) {
    return contentRefusal(error);
  }
  if (result.status === "conflict" || result.status === "missing") {
    return refuse(409, "conflict", STALE_VERSION, toTemplateView(stored));
  }
  const written =
    result.status === "unchanged" ? stored : await writeLive(stored, result.revision, {}, now);
  // A save that landed meanwhile already holds this revision or a newer one: take that row.
  const next = written ?? (await findStoredTemplate(templateId)) ?? stored;
  await closeProposal(templateId, proposalId, "merged", now);
  return accept(toTemplateView(next));
};

/**
 * @function declineProposal
 * @param templateId {string} the upstream template
 * @param proposalId {string} the proposal
 * @param viewer {NonNullable<Viewer>} the upstream's owner
 * @returns {Promise<Answer<null>>} null once declined; 404 for one not open
 */
export const declineProposal = async (
  templateId: string,
  proposalId: string,
  viewer: NonNullable<Viewer>,
): Promise<Answer<null>> => {
  const owned = await ownedTemplate(templateId, viewer);
  if (!owned.ok) return owned;
  return (await closeProposal(templateId, proposalId, "declined")) ? accept(null) : PROPOSAL_GONE;
};

/**
 * @function withdrawProposal
 * @param templateId {string} the fork it came from, or the template it was sent to
 * @param proposalId {string} the proposal
 * @param viewer {NonNullable<Viewer>} the proposer
 * @param now {Date} current time (tests)
 * @returns {Promise<Answer<null>>} null once withdrawn; 403 for anyone but the proposer, 404 for
 *          one not open
 */
export const withdrawProposal = async (
  templateId: string,
  proposalId: string,
  viewer: NonNullable<Viewer>,
  now: Date = new Date(),
): Promise<Answer<null>> => {
  const proposals = await templateProposalsCollection();
  const proposal = await proposals.findOne({
    _id: proposalId,
    status: "open",
    $or: [{ fromId: templateId }, { templateId }],
  });
  if (!proposal) return PROPOSAL_GONE;
  if (proposal.proposer.osuId !== viewer.osuId) return NOT_PROPOSER;
  await proposals.updateOne(
    { _id: proposalId, status: "open" },
    { $set: { status: "withdrawn", updatedAt: now, closedAt: now } },
  );
  return accept(null);
};
