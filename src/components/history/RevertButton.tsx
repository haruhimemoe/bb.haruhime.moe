/**
 * @file src/components/history/RevertButton.tsx
 * @desc Restoring a template to the version being shown: a two-step confirm, then POST the
 *       revert route and go back to editing. A refusal (today's content rules refused the old
 *       text) shows in a live notice.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { InlineConfirm, Notice } from "@haruhimemoe/ui";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { errorMessageOf, sendJson } from "@/utils/api-client";

type RevertButtonProps = { templateId: string; revisionId: string };

/**
 * @function RevertButton
 * @param props {RevertButtonProps} the template and the revision to restore
 * @returns {JSX.Element} the confirm control and an error notice (always mounted)
 */
export function RevertButton({ templateId, revisionId }: RevertButtonProps) {
  const t = useTranslations("bb.history");
  const ui = useTranslations("ui");
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
    setError(await errorMessageOf(response, t("restoreFailed")));
  };
  return (
    <div className="flex flex-col gap-2">
      <InlineConfirm
        trigger={t("restore")}
        question={t("revertQuestion")}
        confirmLabel={ui("actions.confirm")}
        cancelLabel={ui("actions.cancel")}
        onConfirm={confirm}
      />
      <Notice tone="error" live>
        {error ?? ""}
      </Notice>
    </div>
  );
}
