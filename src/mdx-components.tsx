/**
 * @file src/mdx-components.tsx
 * @desc Global MDX element overrides (required by @next/mdx in the App Router): ui's shared
 *       `a`, `h2` through `h4`, `pre`, `table` and `blockquote` overrides (internal links via
 *       next/link, external http(s) links in a new tab, heading anchors, GitHub-style callouts,
 *       code blocks), figures and embeds, plus guides' own <Example source="..." />, the docs'
 *       live example, <Kbd> for keyboard shortcuts (MDX never swaps a literal `<kbd>` for a
 *       component, so guides write `<Kbd>` directly), and next-kit's legal blocks bound to
 *       LEGAL_SITE so the legal pages write `<Processors />` etc. with no props.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

import {
  Changes,
  DataWeKeep,
  DmcaNotice,
  LegalContact,
  NoWarranty,
  Processors,
  YourRights,
} from "@haruhimemoe/next-kit/legal";
import { Kbd, mdxComponents } from "@haruhimemoe/ui/mdx";
import type { MDXComponents } from "mdx/types";
import { LiveExample } from "@/components/docs/LiveExample";
import { LEGAL_SITE } from "@/constants/legal-site";

const components: MDXComponents = {
  ...mdxComponents,
  Kbd,
  // <Example source="[b]x[/b]" /> in a guide: an editable example with its preview.
  Example: LiveExample,
  // The legal pages' blocks, bound to LEGAL_SITE: <Processors /> instead of <Processors site={...} />.
  LegalContact: () => <LegalContact site={LEGAL_SITE} />,
  DataWeKeep: () => <DataWeKeep site={LEGAL_SITE} />,
  Processors: () => <Processors site={LEGAL_SITE} />,
  YourRights: () => <YourRights site={LEGAL_SITE} />,
  DmcaNotice: () => <DmcaNotice site={LEGAL_SITE} />,
  NoWarranty: () => <NoWarranty site={LEGAL_SITE} />,
  Changes: (props: { date?: string }) => <Changes site={LEGAL_SITE} date={props.date} />,
};

/**
 * @function useMDXComponents
 * @returns {MDXComponents} the legal pages' and guides' elements, styled like the rest of the
 *          site
 */
export function useMDXComponents(): MDXComponents {
  return components;
}
