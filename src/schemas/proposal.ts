/**
 * @file src/schemas/proposal.ts
 * @desc Proposals: a fork's changes offered back to the template it copied, like a pull request.
 *       The stored row (the fork's content at proposing, the upstream revision it started from,
 *       who and why, and where it stands), the body of POST /api/templates/<fork>/propose, and
 *       what the upstream's owner is shown (with what the proposal changes).
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import type { Change } from "@haruhimemoe/vcs/json";
import { z } from "zod";
import type { TemplateSnapshot } from "@/utils/template-snapshot";

/** The longest note a proposal carries. */
export const PROPOSAL_MESSAGE_MAX = 280;

/** Where a proposal stands. */
export const PROPOSAL_STATUSES = ["open", "merged", "declined", "withdrawn"] as const;

/** One of PROPOSAL_STATUSES. */
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

/** A stored proposal. */
export type StoredProposal = {
  /** `p-` and 8 base36 characters. */
  _id: string;
  /** The template it's offered to. */
  templateId: string;
  /** The fork it came from. */
  fromId: string;
  proposer: { osuId: number; username: string };
  /** The upstream revision the fork's changes start from. */
  base: string;
  /** The fork's content when it was proposed. */
  value: TemplateSnapshot;
  message: string;
  status: ProposalStatus;
  createdAt: Date;
  updatedAt: Date;
};

/** POST /api/templates/<fork>/propose: a note for the upstream's owner. */
export const proposalBodySchema = z
  .object({ message: z.string().trim().max(PROPOSAL_MESSAGE_MAX).default("") })
  .strict();

/** A proposal as its proposer and the upstream's owner see it. */
export type ProposalView = {
  id: string;
  templateId: string;
  fromId: string;
  proposer: { osuId: number; username: string };
  message: string;
  status: ProposalStatus;
  /** ISO time it was proposed or last updated. */
  updatedAt: string;
  /** What it changes against the revision it started from. */
  changes: Change[];
};
