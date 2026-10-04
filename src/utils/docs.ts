/**
 * @file src/utils/docs.ts
 * @desc The tag pages' names: a URL slug for every tag in @haruhimemoe/bbcode's TAGS (the list
 *       item `*` is "list-item"), the tag behind a slug, and a tag's title and plain-text
 *       description. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 4, 2026
 */

import { TAGS, type TagSpec } from "@haruhimemoe/bbcode";
import { TAG_DOCS } from "@/constants/tag-docs";

/**
 * @function tagSlug
 * @param name {string} a TAGS name
 * @returns {string} its docs slug
 */
export const tagSlug = (name: string): string => (name === "*" ? "list-item" : name);

/**
 * @function tagBySlug
 * @param slug {string} untrusted route segment
 * @returns {TagSpec | undefined} the tag it names
 */
export const tagBySlug = (slug: string): TagSpec | undefined =>
  TAGS.find((tag) => tagSlug(tag.name) === slug);

/**
 * @function tagDescription
 * @param tag {TagSpec} a tag
 * @returns {string} its TAGS description as plain text (the Markdown backticks dropped)
 */
export const tagDescription = (tag: TagSpec): string => tag.description.replace(/`/g, "");

/**
 * @function tagTitle
 * @param tag {TagSpec} a tag
 * @returns {string} its docs title, "Bold"
 */
export const tagTitle = (tag: TagSpec): string => TAG_DOCS[tag.name]?.title ?? tag.name;
