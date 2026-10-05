/**
 * @file src/hooks/useUpstreamPull.ts
 * @desc Pulling a fork's upstream changes in: POSTs /api/templates/<id>/pull and hands the result
 *       to the caller. A clean pull's template replaces the form's saved and draft; a 409
 *       `pull_conflict` hands back the merged draft and the upstream revision it should carry on
 *       the next save (PATCH's `pulled`), so the caller can show it and keep editing.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

"use client";

import { useState } from "react";
import type { TemplateView } from "@/schemas/template-view";
import { sendJson } from "@/utils/api-client";
import type { TemplateDraft } from "@/utils/template-draft";

/** What a pull call resolves to. */
export type PullResult =
  | { ok: true; template: TemplateView }
  | { ok: false; message: string; draft?: Partial<TemplateDraft>; pulled?: string };

/** usePullUpstream's state and the function that runs a pull. */
export type UpstreamPull = {
  busy: boolean;
  /** POSTs the pull; resolves once it's settled. */
  pull: () => Promise<PullResult>;
};

/**
 * @function useUpstreamPull
 * @param id {string} the fork's id
 * @returns {UpstreamPull} whether a pull is in flight, and the function that runs one
 */
export function useUpstreamPull(id: string): UpstreamPull {
  const [busy, setBusy] = useState(false);
  const pull = async (): Promise<PullResult> => {
    setBusy(true);
    try {
      const response = await sendJson(`/api/templates/${id}/pull`, "POST");
      const body = (await response.json().catch(() => null)) as {
        template?: TemplateView;
        error?: {
          code?: string;
          message?: string;
          draft?: Partial<TemplateDraft>;
          pulled?: string;
        };
      } | null;
      if (response.ok && body?.template) return { ok: true, template: body.template };
      if (response.status === 409 && body?.error?.code === "pull_conflict") {
        return {
          ok: false,
          message: body.error.message ?? "That pull conflicted.",
          draft: body.error.draft,
          pulled: body.error.pulled,
        };
      }
      const message = body?.error?.message;
      return {
        ok: false,
        message:
          typeof message === "string" && message !== ""
            ? message
            : `Pulling changes failed (${response.status}).`,
      };
    } catch {
      return { ok: false, message: "Couldn't reach bb. Nothing was pulled." };
    } finally {
      setBusy(false);
    }
  };
  return { busy, pull };
}
