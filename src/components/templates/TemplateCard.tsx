/**
 * @file src/components/templates/TemplateCard.tsx
 * @desc One template in the gallery: its name (the link to its page), kind, "Built in" for ours,
 *       who made it, how often it was used, its description and a short preview.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

import { Badge, Surface, TextLink } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import { BbPreview } from "@/components/editor/BbPreview";
import type { TemplateView } from "@/schemas/template-view";

/**
 * @function TemplateCard
 * @param props {{ template: TemplateView }} the template
 * @returns {JSX.Element} the card, as a Surface (CardGrid owns the list item)
 */
export function TemplateCard({ template }: { template: TemplateView }) {
  const t = useTranslations("bb");
  return (
    <Surface padding="md" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">{t(`kinds.${template.kind}`)}</Badge>
        {template.builtIn ? <Badge tone="muted">{t("card.builtIn")}</Badge> : null}
      </div>
      <h3 className="font-bold text-c1 text-lg">
        <TextLink href={`/t/${template.id}`} variant="plain">
          {template.name}
        </TextLink>
      </h3>
      <p className="text-c4 text-xs">
        {template.builtIn ? t("card.byBb") : t("card.by", { name: template.ownerName ?? "" })} ·{" "}
        {t("uses", { count: template.uses })}
      </p>
      {template.description ? <p className="text-c2 text-sm">{template.description}</p> : null}
      <BbPreview source={template.body} compact />
    </Surface>
  );
}
