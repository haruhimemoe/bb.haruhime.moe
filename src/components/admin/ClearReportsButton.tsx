/**
 * @file src/components/admin/ClearReportsButton.tsx
 * @desc "Clear reports" on /admin: resets a template's report counter and shows it again if
 *       reports hid it. Says what happened beside the button.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { AsyncButton } from "@haruhimemoe/ui";
import { errorMessageOf, sendJson } from "@/utils/api-client";

/**
 * @function ClearReportsButton
 * @param props {{ templateId: string }} the template
 * @returns {JSX.Element} the button, with what happened after it
 */
export function ClearReportsButton({ templateId }: { templateId: string }) {
  const clear = async () => {
    const response = await sendJson(`/api/admin/templates/${templateId}/reports`, "DELETE");
    if (!response.ok) throw new Error(await errorMessageOf(response, "Clearing failed"));
    return "Cleared. It shows again.";
  };
  return (
    <AsyncButton
      variant="secondary"
      action={clear}
      pendingLabel="Clearing…"
      failedMessage={(error) => (error instanceof Error ? error.message : "Clearing failed.")}
    >
      Clear reports
    </AsyncButton>
  );
}
