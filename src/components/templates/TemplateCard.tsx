/**
 * @file src/components/templates/TemplateCard.tsx
 * @desc One template in the gallery: its name (the link to its page), kind, "Built in" for ours,
 *       who made it, how often it was used, its description and a short preview.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { Badge } from "@haruhimemoe/ui";
import Link from "next/link";
import { BbPreview } from "@/components/editor/BbPreview";
import { KIND_LABELS } from "@/constants/templates";
import type { TemplateView } from "@/schemas/template-view";
import { usesText } from "@/utils/template-text";

/**
 * @function TemplateCard
 * @param props {{ template: TemplateView }} the template
 * @returns {JSX.Element} the card, as a list item
 */
export function TemplateCard({ template }: { template: TemplateView }) {
  return (
    <li className="flex flex-col gap-2 rounded-lg bg-b4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">{KIND_LABELS[template.kind]}</Badge>
        {template.builtIn ? <Badge tone="muted">Built in</Badge> : null}
      </div>
      <h3 className="font-bold text-c1 text-lg">
        <Link href={`/t/${template.id}`} className="underline-offset-2 hover:underline">
          {template.name}
        </Link>
      </h3>
      <p className="text-c4 text-xs">
        {template.builtIn ? "By bb" : `By ${template.ownerName}`} · {usesText(template.uses)}
      </p>
      {template.description ? <p className="text-c2 text-sm">{template.description}</p> : null}
      <BbPreview source={template.body} compact />
    </li>
  );
}
