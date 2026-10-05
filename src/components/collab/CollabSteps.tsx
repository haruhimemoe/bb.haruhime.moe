/**
 * @file src/components/collab/CollabSteps.tsx
 * @desc How to make an osu! collab imagemap in three steps, under the collab maker. Server
 *       rendered; the same steps are the page's HowTo JSON-LD.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

import { SectionHeading, Text, TextLink } from "@haruhimemoe/ui";

/** CollabSteps' props. */
export type CollabStepsProps = {
  steps: readonly { name: string; text: string }[];
};

/**
 * @function CollabSteps
 * @param props {CollabStepsProps} the steps
 * @returns {JSX.Element} an H2, the numbered steps and a link to the imagemap guide
 */
export function CollabSteps({ steps }: CollabStepsProps) {
  return (
    <section aria-labelledby="how-to" className="flex flex-col gap-3">
      <SectionHeading id="how-to">How to make an osu! collab imagemap</SectionHeading>
      <ol className="flex list-decimal flex-col gap-2 pl-5 text-c2">
        {steps.map((step) => (
          <li key={step.name}>
            <span className="font-bold text-c1">{step.name}.</span> {step.text}
          </li>
        ))}
      </ol>
      <Text tone="muted">
        The <TextLink href="/guides/imagemaps-and-collabs">imagemap guide</TextLink> explains the
        format line by line.
      </Text>
    </section>
  );
}
