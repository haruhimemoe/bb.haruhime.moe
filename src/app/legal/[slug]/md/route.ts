/**
 * @file src/app/legal/[slug]/md/route.ts
 * @desc The Markdown mirror of a legal page, served at /legal/<slug>.md (next.config.ts
 *       rewrites it here) for AI assistants (llms.txt links it) and "Copy as Markdown".
 *       Static; unregistered slugs never build and answer 404. Uses LEGAL_MARKDOWN_OPTIONS so a
 *       page's `<YourRights />`/`<Processors />`/etc. blocks render as real Markdown instead of
 *       being dropped as unknown JSX.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 4, 2026
 * @modified Mon Oct 5, 2026
 */

import { contentParams } from "@haruhimemoe/next-kit/docs";
import { readContentMarkdown } from "@haruhimemoe/next-kit/docs/files";
import { textResponse } from "@haruhimemoe/next-kit/seo";
import { CONTENT } from "@/constants/content";
import { LEGAL_MARKDOWN_OPTIONS } from "@/utils/docs-markdown";

/** Built at deploy. */
export const dynamic = "force-static";
/** Only registered pages exist; anything else is a 404. */
export const dynamicParams = false;

/**
 * @function generateStaticParams
 * @returns {{ slug: string }[]} one param per registered legal page
 */
export const generateStaticParams = () => contentParams(CONTENT, "legal");

/**
 * @function GET
 * @param _request {Request} the incoming request
 * @param context {RouteContext<"/legal/[slug]/md">} the route segment
 * @returns {Promise<Response>} 200 text/markdown, or 404 for an unregistered slug
 */
export async function GET(_request: Request, { params }: RouteContext<"/legal/[slug]/md">) {
  const { slug } = await params;
  const md = await readContentMarkdown(CONTENT, "legal", slug, LEGAL_MARKDOWN_OPTIONS);
  // Explicit 404: notFound() in a route handler misbehaves on Next 16.
  if (md === null) return new Response("Not found.\n", { status: 404 });
  return textResponse(md, { type: "text/markdown", maxAge: 3600 });
}
