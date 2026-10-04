/**
 * @file src/content/load.ts
 * @desc One MDX loader per registered content page, by section and slug. Static imports:
 *       @next/mdx compiles only files named in the source, so each page is listed here
 *       (tests/unit/content/registry.test.ts holds it to the registry and the files on disk).
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 4, 2026
 * @modified Sun Oct 4, 2026
 */

import type { ContentSection } from "@haruhimemoe/next-kit/docs";
import type { ComponentType } from "react";

type Loader = () => Promise<{ default: ComponentType }>;

/** Static imports: @next/mdx compiles only files named in the source. */
export const LOADERS: Partial<Record<ContentSection, Record<string, Loader>>> = {
  docs: { api: () => import("@content/docs/api.mdx") },
  guides: {
    "getting-started": () => import("@content/guides/getting-started.mdx"),
    userpage: () => import("@content/guides/userpage.mdx"),
    "tournament-forum-post": () => import("@content/guides/tournament-forum-post.mdx"),
    flags: () => import("@content/guides/flags.mdx"),
    "colors-and-gradients": () => import("@content/guides/colors-and-gradients.mdx"),
    "imagemaps-and-collabs": () => import("@content/guides/imagemaps-and-collabs.mdx"),
    "limits-and-gotchas": () => import("@content/guides/limits-and-gotchas.mdx"),
  },
  legal: {
    privacy: () => import("@content/legal/privacy.mdx"),
    terms: () => import("@content/legal/terms.mdx"),
  },
};
