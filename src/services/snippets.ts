/**
 * @file src/services/snippets.ts
 * @desc Snippets are templates of kind `snippet` (so they have history, forks and proposals like
 *       any template). The editor's Snippets tool lists the caller's own, whatever their
 *       visibility, and the public ones others share, most used first; hidden and private ones
 *       of others never show.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import "server-only";
import { templatesCollection } from "@/models/Template";
import type { TemplateField } from "@/schemas/template-field";
import type { Viewer } from "@/utils/template-access";

/** The most of each list the tool shows. */
const MINE_MAX = 50;
const SHARED_MAX = 24;

/** One snippet as the editor needs it. */
export type SnippetItem = {
  id: string;
  name: string;
  description: string;
  body: string;
  fields: TemplateField[];
  ownerName: string;
};

/** The Snippets tool's lists, and whether the caller is signed in (to save their own). */
export type SnippetLists = { mine: SnippetItem[]; shared: SnippetItem[]; signedIn: boolean };

const PROJECTION = { name: 1, description: 1, body: 1, fields: 1, ownerName: 1 } as const;

const itemOf = (row: Omit<SnippetItem, "id"> & { _id: string }): SnippetItem => ({
  id: row._id,
  name: row.name,
  description: row.description,
  body: row.body,
  fields: row.fields,
  ownerName: row.ownerName,
});

/**
 * @function listSnippets
 * @param viewer {Viewer} the caller (null signed out)
 * @returns {Promise<SnippetLists>} their snippets, newest change first, and the shared ones
 */
export const listSnippets = async (viewer: Viewer): Promise<SnippetLists> => {
  const templates = await templatesCollection();
  const mine = viewer
    ? await templates
        .find({ ownerOsuId: viewer.osuId, kind: "snippet" }, { projection: PROJECTION })
        .sort({ updatedAt: -1 })
        .limit(MINE_MAX)
        .toArray()
    : [];
  const shared = await templates
    .find(
      {
        kind: "snippet",
        visibility: "public",
        hidden: { $ne: true },
        ...(viewer ? { ownerOsuId: { $ne: viewer.osuId } } : {}),
      },
      { projection: PROJECTION },
    )
    .sort({ uses: -1, updatedAt: -1 })
    .limit(SHARED_MAX)
    .toArray();
  return { mine: mine.map(itemOf), shared: shared.map(itemOf), signedIn: viewer !== null };
};
