/**
 * @file src/mdx-components.tsx
 * @desc Global MDX element overrides (required by @next/mdx in the App Router): ui's shared
 *       `a`, `h2` through `h4`, `pre`, `table` and `blockquote` overrides (internal links via
 *       next/link, external http(s) links in a new tab, heading anchors, GitHub-style callouts,
 *       code blocks), figures and embeds, plus guides' own <Example source="..." />, the docs'
 *       live example, and <Kbd> for keyboard shortcuts (MDX never swaps a literal `<kbd>` for a
 *       component, so guides write `<Kbd>` directly).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

import { Kbd, mdxComponents } from "@haruhimemoe/ui/mdx";
import type { MDXComponents } from "mdx/types";
import { LiveExample } from "@/components/docs/LiveExample";

const components: MDXComponents = {
  ...mdxComponents,
  Kbd,
  // <Example source="[b]x[/b]" /> in a guide: an editable example with its preview.
  Example: LiveExample,
};

/**
 * @function useMDXComponents
 * @returns {MDXComponents} the legal pages' and guides' elements, styled like the rest of the
 *          site
 */
export function useMDXComponents(): MDXComponents {
  return components;
}
