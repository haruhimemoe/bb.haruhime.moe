/**
 * @file src/utils/account-copy.ts
 * @desc The "Delete my account" warning, which names how many templates go with the account.
 *       Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

/**
 * @function deletesSentence
 * @param templateCount {number} how many templates the account owns
 * @returns {string} what deleting takes with it, and that drafts in the browser stay
 */
export const deletesSentence = (templateCount: number): string => {
  const owned =
    templateCount === 1
      ? "your template"
      : `all ${templateCount.toLocaleString("en-US")} of your templates`;
  const what = templateCount === 0 ? "signs you out" : `${owned}, and signs you out`;
  return `This deletes your account and ${what} everywhere. Drafts saved in your browser stay there. It can't be undone.`;
};
