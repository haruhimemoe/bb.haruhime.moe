/**
 * @file src/app/llms.txt/route.ts
 * @desc GET /llms.txt: a map of the site for AI assistants (llmstxt.org), with notes, the docs,
 *       the built-in templates and every public template reports haven't hidden (private and
 *       unlisted ones never appear). ISR, hourly; a database error fails the render, so ISR
 *       keeps serving the last good one.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 4, 2026
 */

import { textResponse } from "@haruhimemoe/next-kit/seo";
import { builtinTemplates } from "@/lib/builtin-templates";
import { listPublicTemplates } from "@/services/template-gallery";
import { buildLlmsTxt, llmsSections } from "@/utils/llms-txt";

/** Rebuilt at most once an hour. */
export const revalidate = 3600;

/**
 * @function GET
 * @returns {Promise<Response>} the site's llms.txt as plain text
 */
export async function GET() {
  const templates = await listPublicTemplates();
  const text = buildLlmsTxt(
    llmsSections({
      builtIns: [...builtinTemplates()],
      templates: templates.map((row) => ({
        id: row._id,
        name: row.name,
        kind: row.kind,
        description: row.description,
      })),
    }),
  );
  return textResponse(text, { maxAge: 3600 });
}
