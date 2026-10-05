/**
 * @file src/components/me/UpstreamNotice.tsx
 * @desc Above a fork's form: nothing for a template that isn't a fork or is current, a plain
 *       notice when its upstream is gone, and a "Pull changes" button when the upstream has
 *       changes to offer.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

"use client";

import { Button, Notice } from "@haruhimemoe/ui";
import { type PullResult, useUpstreamPull } from "@/hooks/useUpstreamPull";
import type { UpstreamState } from "@/services/template-upstream";

/** Said when the fork's upstream is gone. */
export const UPSTREAM_GONE_NOTICE = "The template you copied isn't available any more.";

type UpstreamNoticeProps = {
  /** The fork being edited. */
  templateId: string;
  /** Where it stands against its upstream (src/services/template-upstream.ts). */
  state: UpstreamState;
  /** Called with a clean pull's template, or a conflict's draft and the revision to carry on. */
  onPulled: (result: PullResult) => void;
};

/**
 * @function UpstreamNotice
 * @param props {UpstreamNoticeProps} the fork, its upstream state and the pull callback
 * @returns {JSX.Element | null} the notice, or null when there's nothing to say
 */
export function UpstreamNotice({ templateId, state, onPulled }: UpstreamNoticeProps) {
  const { busy, pull } = useUpstreamPull(templateId);
  if (state.state === "none" || state.state === "current") return null;
  if (state.state === "gone") {
    return <Notice tone="info">{UPSTREAM_GONE_NOTICE}</Notice>;
  }
  const plural = state.changes === 1 ? "change" : "changes";
  return (
    <Notice tone="info">
      <div className="flex flex-wrap items-center gap-3">
        <span>
          {state.upstream.name} changed since you copied it ({state.changes} {plural}). Pull them
          in?
        </span>
        <Button type="button" disabled={busy} onClick={() => void pull().then(onPulled)}>
          {busy ? "Pulling…" : "Pull changes"}
        </Button>
      </div>
    </Notice>
  );
}
