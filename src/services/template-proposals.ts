/**
 * @file src/services/template-proposals.ts
 * @desc Proposals, git-like collaboration on templates: a fork's owner offers the fork's changes
 *       back to the template it copied, and that template's owner sees them with what they
 *       change. Proposing stores the fork's BBCode and fields (its name, description and kind
 *       stay its own) on top of the upstream revision it started from; one open proposal per
 *       fork, and proposing again replaces it. Built-in templates take no proposals. Merging,
 *       declining and withdrawing are src/services/template-proposal-merge.ts.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import "server-only";
import { diffValue } from "@haruhimemoe/vcs/json";
import { templateRevisions } from "@/lib/template-revisions";
import { templateProposalsCollection } from "@/models/Template";
import type { ProposalView, StoredProposal } from "@/schemas/proposal";
import { ensureHistory } from "@/services/template-history";
import { findStoredTemplate } from "@/services/templates-read";
import { type Owner, ownedTemplate } from "@/services/templates-update";
import { type Answer, accept, NOT_FOUND, NOT_OWNER, refuse } from "@/utils/answer";
import { canView, isOwner, type Viewer } from "@/utils/template-access";
import { isBuiltinId, newTemplateId } from "@/utils/template-ids";
import { forkRefOf, TEMPLATE_CODEC } from "@/utils/template-snapshot";

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

/** MongoDB's duplicate key error: the open-proposal-per-fork index. */
const DUPLICATE_KEY = 11000;

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
  // Hidden templates take no proposals, not even from admins who can see them.
  if (!ref?.rev || !upstream || upstream.hidden || !canView(upstream, viewer)) {
    return UPSTREAM_UNAVAILABLE;
  }
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
  try {
    await proposals.insertOne(created);
  } catch (error) {
    if ((error as { code?: unknown }).code !== DUPLICATE_KEY) throw error;
    // Another propose from this fork won the race (one open proposal per fork): replace that.
    const raced = await proposals.findOneAndUpdate(
      { fromId: fork._id, templateId: upstream._id, status: "open" },
      { $set: set },
      { returnDocument: "after" },
    );
    if (!raced) throw new Error("proposal insert failed");
    return accept(await viewOf(raced));
  }
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
 * @function openProposalFrom
 * @param forkId {string} a fork
 * @param viewer {NonNullable<Viewer>} the caller
 * @returns {Promise<string | null>} the id of the fork's open proposal when the caller made it,
 *          else null
 */
export const openProposalFrom = async (
  forkId: string,
  viewer: NonNullable<Viewer>,
): Promise<string | null> => {
  const open = await (await templateProposalsCollection()).findOne(
    { fromId: forkId, status: "open", "proposer.osuId": viewer.osuId },
    { projection: { _id: 1 } },
  );
  return open?._id ?? null;
};
