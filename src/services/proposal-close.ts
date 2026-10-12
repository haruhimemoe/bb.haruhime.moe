/**
 * @file src/services/proposal-close.ts
 * @desc Closing an open proposal as merged or declined, shared by the proposal routes and by a
 *       template save that resolves a proposal's conflict (PATCH's `merged`).
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
 * @returns {Promise<boolean>} true when an open proposal of that template closed
 */
export const closeProposal = async (
  templateId: string,
  proposalId: string,
  status: "merged" | "declined",
  now: Date = new Date(),
): Promise<boolean> => {
  const { modifiedCount } = await (await templateProposalsCollection()).updateOne(
    { _id: proposalId, templateId, status: "open" },
    { $set: { status, updatedAt: now } },
  );
  return modifiedCount === 1;
};
