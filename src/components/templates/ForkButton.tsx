/**
 * @file src/components/templates/ForkButton.tsx
 * @desc "Fork": copies the template into a new private one of the signed-in user's, then opens
 *       it for editing. A refusal (the 100-template cap, the rate limit) is said beside it.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { AsyncButton } from "@haruhimemoe/ui";
import { useRouter } from "next/navigation";
import type { TemplateView } from "@/schemas/template-view";
import { errorMessageOf, sendJson } from "@/utils/api-client";

/**
 * @function ForkButton
 * @param props {{ templateId: string }} the template to copy
 * @returns {JSX.Element} the button, with any refusal after it
 */
export function ForkButton({ templateId }: { templateId: string }) {
  const router = useRouter();
  const fork = async () => {
    const response = await sendJson(`/api/templates/${templateId}/fork`, "POST");
    if (!response.ok) throw new Error(await errorMessageOf(response, "Forking failed"));
    const { template } = (await response.json()) as { template: TemplateView };
    router.push(`/me/${template.id}/edit`);
    return null;
  };
  return (
    <AsyncButton
      variant="secondary"
      action={fork}
      pendingLabel="Forking…"
      failedMessage={(error) => (error instanceof Error ? error.message : "Forking failed.")}
    >
      Fork
    </AsyncButton>
  );
}
