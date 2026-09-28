/**
 * @file src/services/templates-create.ts
 * @desc Making templates: a new one from the editor's form, or a fork (a private copy of a
 *       template the caller can see, built-in ones included, named "<name> (copy)" and pointing
 *       back with forkOf). Ids are `t-` and 8 random characters, drawn again on the rare clash.
 *       Each account owns at most MAX_TEMPLATES_PER_USER: counted before the insert and again
 *       after it, which backs out when a burst went over (a burst can fall short, never over).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import "server-only";
import { isDuplicateKeyError } from "@haruhimemoe/next-kit/mongo";
import { MAX_TEMPLATES_PER_USER, type Visibility } from "@/constants/templates";
import { templatesCollection } from "@/models/Template";
import type { SessionUser } from "@/schemas/session-user";
import {
  type StoredTemplate,
  type TemplateContent,
  templateContentSchema,
} from "@/schemas/template";
import type { TemplateView } from "@/schemas/template-view";
import { type Answer, accept, NOT_FOUND, refuse } from "@/utils/answer";
import { newTemplateId } from "@/utils/template-ids";
import { forkName, toTemplateView } from "@/utils/template-view";
import { getTemplateFor } from "./templates-read";

/** Who makes a template. */
export type Maker = Pick<SessionUser, "osuId" | "username" | "isAdmin">;

const LIMIT_REACHED = refuse(
  403,
  "template_limit",
  `You can keep up to ${MAX_TEMPLATES_PER_USER} templates. Delete one to make another.`,
);

const ID_ATTEMPTS = 3;

/**
 * @function insertTemplate
 * @param maker {Maker} the owner
 * @param content {TemplateContent} checked content
 * @param visibility {Visibility} who sees it
 * @param forkOf {string | null} the template it copies
 * @param now {Date} current time (tests)
 * @returns {Promise<Answer<TemplateView>>} the stored template, or a refusal at the cap
 */
export const insertTemplate = async (
  maker: Maker,
  content: TemplateContent,
  visibility: Visibility,
  forkOf: string | null,
  now: Date = new Date(),
): Promise<Answer<TemplateView>> => {
  const templates = await templatesCollection();
  const owned = { ownerOsuId: maker.osuId };
  if ((await templates.countDocuments(owned)) >= MAX_TEMPLATES_PER_USER) return LIMIT_REACHED;
  for (let attempt = 1; attempt <= ID_ATTEMPTS; attempt++) {
    const row: StoredTemplate = {
      _id: newTemplateId(),
      ownerOsuId: maker.osuId,
      ownerName: maker.username,
      ...content,
      visibility,
      forkOf,
      uses: 0,
      reports: 0,
      hidden: false,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
    try {
      await templates.insertOne(row);
    } catch (error) {
      if (isDuplicateKeyError(error) && attempt < ID_ATTEMPTS) continue;
      throw error;
    }
    if ((await templates.countDocuments(owned)) > MAX_TEMPLATES_PER_USER) {
      await templates.deleteOne({ _id: row._id });
      return LIMIT_REACHED;
    }
    return accept(toTemplateView(row));
  }
  /* v8 ignore next */
  throw new Error("unreachable: the last attempt returns or throws");
};

/**
 * @function forkTemplate
 * @param id {string} the template to copy
 * @param maker {Maker} who copies it
 * @param now {Date} current time (tests)
 * @returns {Promise<Answer<TemplateView>>} the new private copy, a 404 when the caller can't
 *          see the original, a 400 when the original fails today's rules, or the cap
 */
export const forkTemplate = async (
  id: string,
  maker: Maker,
  now: Date = new Date(),
): Promise<Answer<TemplateView>> => {
  const source = await getTemplateFor(id, maker);
  if (!source) return NOT_FOUND;
  const content = templateContentSchema.safeParse({
    name: forkName(source.name),
    description: source.description,
    kind: source.kind,
    body: source.body,
    fields: source.fields,
  });
  if (!content.success) {
    const issue = content.error.issues[0];
    const code = issue?.code === "custom" ? issue.params?.code : undefined;
    return refuse(
      400,
      typeof code === "string" ? code : "bad_request",
      issue?.message ?? "That template can't be copied as it is.",
    );
  }
  return insertTemplate(maker, content.data, "private", id, now);
};
