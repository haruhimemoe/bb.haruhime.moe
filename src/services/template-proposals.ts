/**
 * @file src/services/template-proposals.ts
 * @desc Proposals, git-like collaboration on templates: a fork's owner offers the fork's changes
 *       back to the template it copied, and that template's owner merges or declines them.
 *       Proposing stores the fork's BBCode and fields (its name, description and kind stay its
 *       own) on top of the upstream revision it started from (one open proposal per fork;
 *       proposing again replaces it). Merging commits that content onto the
 *       upstream from that revision, so the revision store's 3-way merge keeps the owner's own
 *       changes since; a clean merge is credited to the proposer in the revision's message, an
 *       overlap writes nothing and hands back the merged draft (409 `proposal_conflict`), which
 *       the owner's resolving save closes (PATCH's `merged`). The proposer can withdraw. Built-in
 *       templates take no proposals.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import "server-only";
import { diffValue } from "@haruhimemoe/vcs/json";
import { templateRevisions } from "@/lib/template-revisions";
import { templateProposalsCollection } from "@/models/Template";
import type { ProposalView, StoredProposal } from "@/schemas/proposal";
import type { TemplateView } from "@/schemas/template-view";
import { closeProposal } from "@/services/proposal-close";
import { authorOf, ensureHistory, refOf, writeLive } from "@/services/template-history";
import { findStoredTemplate } from "@/services/templates-read";
import {
  contentRefusal,
  type Owner,
  ownedTemplate,
  STALE_VERSION,
} from "@/services/templates-update";
import { type Answer, accept, NOT_FOUND, NOT_OWNER, refuse } from "@/utils/answer";
import { canView, isOwner, type Viewer } from "@/utils/template-access";
import { isBuiltinId, newTemplateId } from "@/utils/template-ids";
import { forkRefOf, TEMPLATE_CODEC } from "@/utils/template-snapshot";
import { toTemplateView } from "@/utils/template-view";

/** The 409 message: the proposal and the owner's changes touch the same lines. */
export const PROPOSAL_CONFLICT =
  "This proposal and your own changes touch the same places. The merged text is in the form with your version where they clash; check it and save.";

const UPSTREAM_UNAVAILABLE = refuse(
  404,
  "upstream_unavailable",
  "This copy has no original to propose to any more.",
);
const NO_CHANGES = refuse(
  409,
  "no_changes",
  "Your copy has no changes since you last took in the original.",
);
const NOT_PROPOSER = refuse(403, "forbidden", "Only the person who proposed it can withdraw it.");
const PROPOSAL_GONE = refuse(404, "proposal_not_found", "That proposal isn't open any more.");

const newProposalId = (): string => `p-${newTemplateId().slice(2)}`;

const viewOf = async (proposal: StoredProposal): Promise<ProposalView> => {
  const base = await templateRevisions.get(proposal.templateId, proposal.base);
  return {
    id: proposal._id,
    templateId: proposal.templateId,
    fromId: proposal.fromId,
    proposer: proposal.proposer,
    message: proposal.message,
    status: proposal.status,
    updatedAt: proposal.updatedAt.toISOString(),
    changes: base ? diffValue(base.value, proposal.value, TEMPLATE_CODEC) : [],
  };
};

/**
 * @function createProposal
 * @param forkId {string} the fork whose changes are offered
 * @param viewer {Owner} the fork's owner
 * @param body {{ message: string }} a note for the upstream's owner
 * @param now {Date} current time (tests)
 * @returns {Promise<Answer<ProposalView>>} the open proposal; 404 `upstream_unavailable` for a
 *          template that isn't a fork or whose upstream is gone, 403 for a built-in upstream or
 *          someone else's fork, 409 `no_changes` when there's nothing to offer
 */
export const createProposal = async (
  forkId: string,
  viewer: Owner,
  { message }: { message: string },
  now: Date = new Date(),
): Promise<Answer<ProposalView>> => {
  const owned = await ownedTemplate(forkId, viewer);
  if (!owned.ok) return owned;
  const fork = owned.value;
  const ref = forkRefOf(fork.forkOf);
  if (ref && isBuiltinId(ref.docId)) {
    return refuse(403, "built_in", "Built-in templates don't take proposals.");
  }
  const upstream = ref?.rev ? await findStoredTemplate(ref.docId) : null;
  if (!ref?.rev || !upstream || !canView(upstream, viewer)) return UPSTREAM_UNAVAILABLE;
  const [base, head] = await Promise.all([
    templateRevisions.get(upstream._id, ref.rev),
    ensureHistory(fork),
  ]);
  const ours = await templateRevisions.get(fork._id, head.id);
  if (!base || !ours) return UPSTREAM_UNAVAILABLE;
  // Only the BBCode and the fields travel: the fork's name, description and kind are its own.
  const value = { ...base.value, body: ours.value.body, fields: ours.value.fields };
  if (diffValue(base.value, value, TEMPLATE_CODEC).length === 0) return NO_CHANGES;
  const proposals = await templateProposalsCollection();
  const set = { base: base.id, value, message, updatedAt: now };
  const open = await proposals.findOneAndUpdate(
    { fromId: fork._id, templateId: upstream._id, status: "open" },
    { $set: set },
    { returnDocument: "after" },
  );
  if (open) return accept(await viewOf(open));
  const created: StoredProposal = {
    _id: newProposalId(),
    templateId: upstream._id,
    fromId: fork._id,
    proposer: { osuId: viewer.osuId, username: viewer.username },
    status: "open",
    createdAt: now,
    ...set,
  };
  await proposals.insertOne(created);
  return accept(await viewOf(created));
};

/**
 * @function listProposals
 * @param templateId {string} the upstream template
 * @param viewer {Viewer} the caller
 * @returns {Promise<Answer<ProposalView[]>>} its open proposals, newest first, for its owner; 404
 *          when the caller can't see it, 403 for anyone else
 */
export const listProposals = async (
  templateId: string,
  viewer: Viewer,
): Promise<Answer<ProposalView[]>> => {
  const stored = await findStoredTemplate(templateId);
  if (!stored || !canView(stored, viewer)) return NOT_FOUND;
  if (!isOwner(stored, viewer)) return NOT_OWNER;
  const open = await (await templateProposalsCollection())
    .find({ templateId, status: "open" })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();
  return accept(await Promise.all(open.map(viewOf)));
};

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
  await ensureHistory(stored);
  const base = await templateRevisions.get(templateId, proposal.base);
  if (!base) return PROPOSAL_GONE;
  const note = proposal.message ? `: ${proposal.message}` : "";
  let result: Awaited<ReturnType<typeof templateRevisions.commit>>;
  try {
    result = await templateRevisions.commit({
      docId: templateId,
      base: refOf(base),
      value: proposal.value,
      author: authorOf(viewer),
      message: `Merged ${proposal.proposer.username}'s proposal${note}`,
    });
  } catch (error) {
    return contentRefusal(error);
  }
  if (result.status === "conflict") {
    return refuse(409, "proposal_conflict", PROPOSAL_CONFLICT, toTemplateView(stored), {
      conflicts: result.merged.conflicts.map(({ path, kind }) => ({ path, kind })),
      draft: result.merged.value,
      merged: proposalId,
    });
  }
  if (result.status === "missing") {
    return refuse(409, "conflict", STALE_VERSION, toTemplateView(stored));
  }
  const next =
    result.status === "unchanged" ? stored : await writeLive(stored, result.revision, {}, now);
  if (!next) return refuse(409, "conflict", STALE_VERSION, toTemplateView(stored));
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
 * @param proposalId {string} the proposal
 * @param viewer {NonNullable<Viewer>} the proposer
 * @param now {Date} current time (tests)
 * @returns {Promise<Answer<null>>} null once withdrawn; 403 for anyone but the proposer, 404 for
 *          one not open
 */
export const withdrawProposal = async (
  proposalId: string,
  viewer: NonNullable<Viewer>,
  now: Date = new Date(),
): Promise<Answer<null>> => {
  const proposals = await templateProposalsCollection();
  const proposal = await proposals.findOne({ _id: proposalId, status: "open" });
  if (!proposal) return PROPOSAL_GONE;
  if (proposal.proposer.osuId !== viewer.osuId) return NOT_PROPOSER;
  await proposals.updateOne(
    { _id: proposalId, status: "open" },
    { $set: { status: "withdrawn", updatedAt: now } },
  );
  return accept(null);
};
