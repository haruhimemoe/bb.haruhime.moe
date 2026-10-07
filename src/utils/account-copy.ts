/**
 * @file src/utils/account-copy.ts
 * @desc The "Delete my bb data" warning, which names how many templates go. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Tue Oct 6, 2026
 */

/**
 * @function deletesSentence
 * @param templateCount {number} how many templates the account owns
 * @returns {string} what deleting takes with it, that drafts in the browser stay, and that the
 *          haruhime account itself stays
 */
export const deletesSentence = (templateCount: number): string => {
  const owned =
    templateCount === 1
      ? "your template"
      : `all ${templateCount.toLocaleString("en-US")} of your templates`;
  const what = templateCount === 0 ? "your API key" : `${owned} and your API key`;
  return `This deletes ${what} from bb. Drafts saved in your browser stay there, and so does your haruhime account. It can't be undone.`;
};
