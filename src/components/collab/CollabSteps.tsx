/**
 * @file src/components/collab/CollabSteps.tsx
 * @desc How to make an osu! collab imagemap in three steps, under the collab maker. Server
 *       rendered; the same steps are the page's HowTo JSON-LD.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

import { SectionHeading, Text, TextLink } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";

/** The steps, in order ("collab.steps.<id>" in the catalog). */
const STEPS = ["url", "draw", "copy"] as const;

/**
 * @function CollabSteps
 * @returns {JSX.Element} an H2, the numbered steps and a link to the imagemap guide
 */
export function CollabSteps() {
  const t = useTranslations("bb.collab");
  return (
    <section aria-labelledby="how-to" className="flex flex-col gap-3">
      <SectionHeading id="how-to">{t("howTo")}</SectionHeading>
      <ol className="flex list-decimal flex-col gap-2 pl-5 text-c2">
        {STEPS.map((step) => (
          <li key={step}>
            <span className="font-bold text-c1">{t(`steps.${step}.name`)}.</span>{" "}
            {t(`steps.${step}.text`)}
          </li>
        ))}
      </ol>
      <Text tone="muted">
        {t.rich("guideNote", {
          link: (chunks) => <TextLink href="/guides/imagemaps-and-collabs">{chunks}</TextLink>,
        })}
      </Text>
    </section>
  );
}
