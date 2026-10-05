/**
 * @file src/lib/template-revisions.ts
 * @desc templates' history: next-kit's revision store over template_revisions, one line of
 *       snapshots per template (src/utils/template-snapshot.ts). `check` reruns the content
 *       schema on every write, so a revert or a pull can't put back content today's filter
 *       refuses. Nothing connects at import.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import "server-only";
import { createRevisionStore } from "@haruhimemoe/next-kit/vcs";
import { TEMPLATE_REVISIONS_COLLECTION } from "@/constants/db";
import { connectedDb } from "@/lib/db";
import { templateContentSchema } from "@/schemas/template";
import { TEMPLATE_CODEC, type TemplateSnapshot } from "@/utils/template-snapshot";

/** Every person's template's revisions. `check` runs the content rules on every write. */
export const templateRevisions = createRevisionStore<TemplateSnapshot>({
  db: connectedDb,
  collection: TEMPLATE_REVISIONS_COLLECTION,
  codec: TEMPLATE_CODEC,
  check: (value) => {
    templateContentSchema.parse(value);
  },
});
