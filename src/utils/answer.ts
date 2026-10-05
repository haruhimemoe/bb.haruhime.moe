/**
 * @file src/utils/answer.ts
 * @desc What a service hands a route: the value, or a refusal with the HTTP status, a machine
 *       code, the sentence people see and, on a 409, the template as it is now (so the page can
 *       reload it). Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

import type { TemplateView } from "@/schemas/template-view";

/** A service's refusal. */
export type Refusal = {
  ok: false;
  status: number;
  code: string;
  message: string;
  template?: TemplateView;
  /** Extra data a route sends alongside `error` (a merge's conflicts and draft). */
  details?: Record<string, unknown>;
};

/** A service's answer. */
export type Answer<T> = { ok: true; value: T } | Refusal;

/**
 * @function refuse
 * @param status {number} HTTP status
 * @param code {string} machine code
 * @param message {string} what people read
 * @param template {TemplateView | undefined} the current template (a 409)
 * @param details {Record<string, unknown> | undefined} extra data for the route to send
 * @returns {Refusal} the refusal
 */
export const refuse = (
  status: number,
  code: string,
  message: string,
  template?: TemplateView,
  details?: Record<string, unknown>,
): Refusal => ({
  ok: false,
  status,
  code,
  message,
  ...(template ? { template } : {}),
  ...(details ? { details } : {}),
});

/**
 * @function accept
 * @param value {T} the result
 * @returns {Answer<T>} it, as an answer
 */
export const accept = <T>(value: T): Answer<T> => ({ ok: true, value });

/** The template doesn't exist, or the caller can't see it. */
export const NOT_FOUND = refuse(404, "not_found", "That template doesn't exist.");
/** The caller can see it but may not change it. */
export const NOT_OWNER = refuse(403, "forbidden", "Only the template's owner can change it.");
/** Built-in templates are part of the site. */
export const BUILT_IN = refuse(
  403,
  "built_in",
  "Built-in templates can't be changed. Fork one to make your own copy.",
);
