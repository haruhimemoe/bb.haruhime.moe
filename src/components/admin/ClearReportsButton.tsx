/**
 * @file src/components/admin/ClearReportsButton.tsx
 * @desc "Clear reports" on /admin: resets a template's report counter and shows it again if
 *       reports hid it. Says what happened beside the button.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { AsyncButton } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import { errorMessageOf, sendJson } from "@/utils/api-client";

/**
 * @function ClearReportsButton
 * @param props {{ templateId: string }} the template
 * @returns {JSX.Element} the button, with what happened after it
 */
export function ClearReportsButton({ templateId }: { templateId: string }) {
  const t = useTranslations("bb.admin");
  const clear = async () => {
    const response = await sendJson(`/api/admin/templates/${templateId}/reports`, "DELETE");
    if (!response.ok) throw new Error(await errorMessageOf(response, t("clearFailed")));
    return t("cleared");
  };
  return (
    <AsyncButton
      variant="secondary"
      action={clear}
      pendingLabel={t("clearing")}
      failedMessage={(error) => (error instanceof Error ? error.message : t("clearFailedDot"))}
    >
      {t("clear")}
    </AsyncButton>
  );
}
