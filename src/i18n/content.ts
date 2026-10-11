/**
 * @file src/i18n/content.ts
 * @desc The ui content components' own words in the request's language: ContentPage's meta row
 *       (labels, the last-updated label, the date locale). The pages' bodies stay as written.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { uiLabels } from "@haruhimemoe/next-kit/i18n";
import { getLocale, getTranslations } from "next-intl/server";

/**
 * @function contentPageText
 * @returns {Promise<object>} the props to spread on ui's ContentPage: labels, lastUpdatedLabel,
 *          locale
 */
export async function contentPageText() {
  const ui = uiLabels(await getTranslations("ui"));
  return {
    labels: ui.contentPage,
    lastUpdatedLabel: ui.contentNav.lastUpdated,
    locale: await getLocale(),
  };
}
