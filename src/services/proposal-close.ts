/**
 * @file src/services/proposal-close.ts
 * @desc Closing an open proposal as merged or declined, shared by the proposal routes and by a
 *       template save that resolves a proposal's conflict (PATCH's `merged`, which names the
 *       version it resolved). A closed proposal keeps `closedAt`; the TTL index drops it 30 days
 *       later.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import "server-only";
import { templateProposalsCollection } from "@/models/Template";

/**
 * @function closeProposal
 * @param templateId {string} the upstream template
 * @param proposalId {string} the proposal
 * @param status {"merged" | "declined"} how it closes
 * @param now {Date} current time
 * @param at {number | undefined} the proposal's version (its updatedAt in ms) the caller saw;
 *        when given, a proposal changed since stays open
 * @returns {Promise<boolean>} true when an open proposal of that template closed
 */
export const closeProposal = async (
  templateId: string,
  proposalId: string,
  status: "merged" | "declined",
  now: Date = new Date(),
  at?: number,
): Promise<boolean> => {
  const { modifiedCount } = await (await templateProposalsCollection()).updateOne(
    {
      _id: proposalId,
      templateId,
      status: "open",
      ...(at === undefined ? {} : { updatedAt: new Date(at) }),
    },
    { $set: { status, updatedAt: now, closedAt: now } },
  );
  return modifiedCount === 1;
};
