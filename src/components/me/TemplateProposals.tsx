/**
 * @file src/components/me/TemplateProposals.tsx
 * @desc The proposal side of a template's edit page: for a fork whose original is still there,
 *       offering its changes back (ProposeForm); for any template, the proposals sent to it
 *       (ProposalList).
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { type MergeResult, ProposalList } from "@/components/me/ProposalList";
import { ProposeForm } from "@/components/me/ProposeForm";
import type { ProposalView } from "@/schemas/proposal";
import type { UpstreamState } from "@/services/template-upstream";

type TemplateProposalsProps = {
  templateId: string;
  upstream: UpstreamState | undefined;
  proposals: readonly ProposalView[];
  /** The fork's own open proposal, if any. */
  proposed: string | null;
  onMerged: (result: MergeResult) => void;
};

/**
 * @function TemplateProposals
 * @param props {TemplateProposalsProps} the template, its upstream state and proposals
 * @returns {JSX.Element} the propose form when it's a fork, and the proposals sent to it
 */
export function TemplateProposals({
  templateId,
  upstream,
  proposals,
  proposed,
  onMerged,
}: TemplateProposalsProps) {
  return (
    <>
      {upstream?.state === "current" || upstream?.state === "behind" ? (
        <ProposeForm
          templateId={templateId}
          upstreamName={upstream.upstream.name}
          proposalId={proposed}
        />
      ) : null}
      <ProposalList templateId={templateId} proposals={proposals} onMerged={onMerged} />
    </>
  );
}
