/**
 * @file src/components/docs/TagReference.tsx
 * @desc One tag's reference, built from @haruhimemoe/bbcode's TAGS entry and the docs' own words
 *       (src/constants/tag-docs.ts): what it is, its facts (inline or block, one line, content
 *       shown as written, argument), the forms it takes, a live example and what to watch for.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import type { TagSpec } from "@haruhimemoe/bbcode";
import { Badge } from "@haruhimemoe/ui";
import { LiveExample } from "@/components/docs/LiveExample";
import { TAG_DOCS } from "@/constants/tag-docs";

type TagReferenceProps = {
  tag: TagSpec;
};

const ARG_FACT: Readonly<Record<TagSpec["arg"], string | null>> = {
  none: null,
  optional: "Optional argument",
  required: "Needs an argument",
};

/**
 * @function TagReference
 * @param props {TagReferenceProps} the tag
 * @returns {JSX.Element} the tag's facts, syntax, live example and gotchas
 */
export function TagReference({ tag }: TagReferenceProps) {
  const docs = TAG_DOCS[tag.name];
  const facts = [
    tag.display === "block" ? "Block" : "Inline",
    tag.singleLine ? "One line only" : null,
    tag.content === "raw" ? "Content shown as written" : null,
    ARG_FACT[tag.arg],
    ...tag.aliases.map((alias) => `Also [${alias}]`),
  ].filter((fact): fact is string => fact !== null);
  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-wrap gap-2" aria-label="Facts">
        {facts.map((fact) => (
          <li key={fact}>
            <Badge>{fact}</Badge>
          </li>
        ))}
      </ul>
      <section aria-labelledby="syntax" className="flex flex-col gap-2">
        <h2 id="syntax" className="font-bold text-c1 text-lg">
          Syntax
        </h2>
        {(docs?.syntax ?? [tag.example]).map((form) => (
          <pre
            key={form}
            className="overflow-x-auto rounded-md bg-b6 p-3 font-mono text-c2 text-sm"
          >
            {form}
          </pre>
        ))}
      </section>
      <section aria-labelledby="try" className="flex flex-col gap-2">
        <h2 id="try" className="font-bold text-c1 text-lg">
          Try it
        </h2>
        <LiveExample source={docs?.example ?? tag.example} label={`[${tag.name}] example`} />
      </section>
      {docs && docs.gotchas.length > 0 ? (
        <section aria-labelledby="gotchas" className="flex flex-col gap-2">
          <h2 id="gotchas" className="font-bold text-c1 text-lg">
            Good to know
          </h2>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-c2">
            {docs.gotchas.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
