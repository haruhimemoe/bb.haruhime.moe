/**
 * @file src/utils/template-ids.ts
 * @desc Template ids: a person's template is `t-` and 8 random base36 characters, a built-in
 *       one is `bb-` and its file's name. Route params are checked against these before any
 *       read. Pure (randomness comes from Web Crypto, in Node and the browser alike).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { BUILTIN_ID_PATTERN, TEMPLATE_ID_PATTERN } from "@/constants/templates";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/**
 * @function newTemplateId
 * @param random {(bytes: Uint8Array) => Uint8Array} fills bytes (default Web Crypto; tests)
 * @returns {string} `t-` and 8 base36 characters
 */
export const newTemplateId = (
  random: (bytes: Uint8Array) => Uint8Array = (bytes) => crypto.getRandomValues(bytes),
): string => {
  const bytes = random(new Uint8Array(8));
  // 252 is the largest multiple of 36 under 256; the tiny bias from % is harmless for ids.
  return `t-${[...bytes].map((byte) => ALPHABET[byte % ALPHABET.length]).join("")}`;
};

/**
 * @function isTemplateId
 * @param value {string} untrusted text
 * @returns {boolean} true for a person's template id
 */
export const isTemplateId = (value: string): boolean => TEMPLATE_ID_PATTERN.test(value);

/**
 * @function isBuiltinId
 * @param value {string} untrusted text
 * @returns {boolean} true for a built-in template id
 */
export const isBuiltinId = (value: string): boolean => BUILTIN_ID_PATTERN.test(value);

/**
 * @function builtinId
 * @param slug {string} a built-in template's file name without `.bb`
 * @returns {string} its id
 */
export const builtinId = (slug: string): string => `bb-${slug}`;
