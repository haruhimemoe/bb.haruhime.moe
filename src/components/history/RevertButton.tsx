/**
 * @file src/components/history/RevertButton.tsx
 * @desc Restoring a template to the version being shown: a two-step confirm, then POST the
 *       revert route and go back to editing. A refusal (today's content rules refused the old
 *       text) shows in a live notice.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

"use client";

import { InlineConfirm, Notice } from "@haruhimemoe/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HISTORY_COPY } from "@/constants/history";
import { errorMessageOf, sendJson } from "@/utils/api-client";

type RevertButtonProps = { templateId: string; revisionId: string };

/**
 * @function RevertButton
 * @param props {RevertButtonProps} the template and the revision to restore
 * @returns {JSX.Element} the confirm control and an error notice (always mounted)
 */
export function RevertButton({ templateId, revisionId }: RevertButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const confirm = async () => {
    setError(null);
    const response = await sendJson(
      `/api/templates/${templateId}/history/${revisionId}/revert`,
      "POST",
    );
    if (response.ok) {
      router.push(`/me/${templateId}/edit`);
      return;
    }
    setError(await errorMessageOf(response, "Restoring failed"));
  };
  return (
    <div className="flex flex-col gap-2">
      <InlineConfirm
        trigger="Restore this version"
        question={HISTORY_COPY.revertQuestion}
        onConfirm={confirm}
      />
      <Notice tone="error" live>
        {error ?? ""}
      </Notice>
    </div>
  );
}
