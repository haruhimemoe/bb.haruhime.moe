/**
 * @file src/components/templates/TemplateList.tsx
 * @desc A heading and a grid of template cards, or a line saying there are none.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

import { CardGrid, SectionHeading, Text } from "@haruhimemoe/ui";
import { TemplateCard } from "@/components/templates/TemplateCard";
import type { TemplateView } from "@/schemas/template-view";

type TemplateListProps = {
  heading: string;
  templates: readonly TemplateView[];
  /** Said when the list is empty. */
  empty: string;
};

/**
 * @function TemplateList
 * @param props {TemplateListProps} the heading, the templates and the empty line
 * @returns {JSX.Element} the section
 */
export function TemplateList({ heading, templates, empty }: TemplateListProps) {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeading>{heading}</SectionHeading>
      {templates.length === 0 ? (
        <Text tone="muted">{empty}</Text>
      ) : (
        <CardGrid columns={3}>
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </CardGrid>
      )}
    </section>
  );
}
