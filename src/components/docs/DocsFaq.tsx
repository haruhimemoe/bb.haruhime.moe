/**
 * @file src/components/docs/DocsFaq.tsx
 * @desc The docs' questions and answers, server rendered so crawlers and assistants read them;
 *       the same list is the page's FAQPage JSON-LD.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { TextLink } from "@haruhimemoe/ui";
import type { DocsFaqItem } from "@/constants/docs-faq";

/** DocsFaq's props. */
export type DocsFaqProps = {
  items: readonly DocsFaqItem[];
};

/**
 * @function DocsFaq
 * @param props {DocsFaqProps} the questions
 * @returns {JSX.Element} an H2 and one H3 with its answer per question
 */
export function DocsFaq({ items }: DocsFaqProps) {
  return (
    <section aria-labelledby="faq" className="flex flex-col gap-4">
      <h2 id="faq" className="font-bold text-c1 text-xl">
        Questions
      </h2>
      {items.map((item) => (
        <div key={item.question} className="flex flex-col gap-1">
          <h3 className="font-bold text-c1">{item.question}</h3>
          <p className="text-c2">
            {item.answer}
            {item.more ? (
              <>
                {" "}
                <TextLink href={item.more.href}>{item.more.label}</TextLink>
              </>
            ) : null}
          </p>
        </div>
      ))}
    </section>
  );
}
