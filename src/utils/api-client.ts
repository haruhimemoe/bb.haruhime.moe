/**
 * @file src/utils/api-client.ts
 * @desc Reading our own API's answers in the browser: the sentence an error carries
 *       (`{ error: { message } }`), or a plain one with the status when there's none. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

/**
 * @function errorMessageOf
 * @param response {Response} a failed answer
 * @param fallback {string} what failed, like "Saving failed"
 * @returns {Promise<string>} the answer's message, or "<fallback> (<status>)."
 */
export const errorMessageOf = async (response: Response, fallback: string): Promise<string> => {
  try {
    const body = (await response.json()) as { error?: { message?: unknown } };
    const message = body.error?.message;
    return typeof message === "string" && message !== ""
      ? message
      : `${fallback} (${response.status}).`;
  } catch {
    return `${fallback} (${response.status}).`;
  }
};

/**
 * @function sendJson
 * @param url {string} our API path
 * @param method {string} HTTP method
 * @param body {unknown} JSON body (undefined sends none)
 * @returns {Promise<Response>} the answer
 */
export const sendJson = (url: string, method: string, body?: unknown): Promise<Response> =>
  fetch(url, {
    method,
    ...(body === undefined
      ? {}
      : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
