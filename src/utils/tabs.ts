/**
 * @file src/utils/tabs.ts
 * @desc The ids that tie a Tabs tab to its panel (src/components/common/Tabs.tsx). Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

/**
 * @function tabId
 * @param prefix {string} the tab list's id prefix
 * @param tab {string} the tab
 * @returns {string} the tab button's id
 */
export const tabId = (prefix: string, tab: string): string => `${prefix}-tab-${tab}`;

/**
 * @function tabPanelId
 * @param prefix {string} the tab list's id prefix
 * @param tab {string} the tab
 * @returns {string} its panel's id
 */
export const tabPanelId = (prefix: string, tab: string): string => `${prefix}-panel-${tab}`;
