/**
 * @file src/schemas/text.ts
 * @desc The text rules every typed template text shares. One-line text has no control
 *       characters (and no U+2028 or U+2029); multi-line text keeps tabs and line breaks and no
 *       other control character. No text takes a lone surrogate (the driver would store U+FFFD,
 *       so the saved text would differ from the checked one). Everything people type goes
 *       through @haruhimemoe/pool's content filter, whose refusal carries `params.code`
 *       content_filter, which parseJsonBody sends as the error code.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { hasBlockedLanguage } from "@haruhimemoe/pool/content-filter";
import { z } from "zod";

/** The filter's refusal message. */
export const FILTERED = "That fails the content filter.";
/** A zod refinement's params for the filter: parseJsonBody sends the code. */
export const FILTER_ISSUE = { message: FILTERED, params: { code: "content_filter" } };

/** With the u flag, \p{Cs} only matches a surrogate that isn't half of a pair. */
const LONE_SURROGATE = /\p{Cs}/u;
const ONE_LINE = /^[^\p{Cc}\u2028\u2029]*$/u;

/**
 * @function wellFormed
 * @param text {string} any text
 * @returns {boolean} true when no surrogate stands alone
 */
export const wellFormed = (text: string): boolean => !LONE_SURROGATE.test(text);

/**
 * @function showable
 * @param text {string} multi-line text
 * @returns {boolean} true when its only control characters are tabs and line breaks
 */
export const showable = (text: string): boolean => !/\p{Cc}/u.test(text.replace(/[\t\n\r]/g, ""));

/**
 * @function passesFilter
 * @param text {string} typed text
 * @returns {boolean} true when the content filter lets it through
 */
export const passesFilter = (text: string): boolean => !hasBlockedLanguage(text);

/**
 * @function oneLineText
 * @param label {string} what the text is, for messages ("name")
 * @param min {number} fewest characters, trimmed
 * @param max {number} most characters, trimmed
 * @returns {z.ZodString} trimmed one-line text in that range, through the content filter
 */
export const oneLineText = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, min === 1 ? `Give it a ${label}.` : `The ${label} needs ${min} characters or more.`)
    .max(max, `Keep the ${label} to ${max} characters.`)
    .regex(ONE_LINE, `The ${label} can't have line breaks.`)
    .refine(wellFormed, `The ${label} has a broken character.`)
    .refine(passesFilter, FILTER_ISSUE);

/**
 * @function multiLineText
 * @param label {string} what the text is, for messages ("body")
 * @param max {number} most characters
 * @returns {z.ZodString} text up to max characters keeping line breaks, through the content
 *          filter (not trimmed: spacing in BBCode is meaningful)
 */
export const multiLineText = (label: string, max: number) =>
  z
    .string()
    .max(max, `Keep the ${label} to ${max.toLocaleString("en-US")} characters.`)
    .refine(showable, `The ${label} has a control character it can't keep.`)
    .refine(wellFormed, `The ${label} has a broken character.`)
    .refine(passesFilter, FILTER_ISSUE);
