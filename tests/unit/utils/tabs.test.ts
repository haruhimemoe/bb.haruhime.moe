/**
 * @file tests/unit/utils/tabs.test.ts
 * @desc The ids that tie a tab to its panel.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import { tabId, tabPanelId } from "@/utils/tabs";

describe("tab ids", () => {
  it("pair a tab with its panel", () => {
    expect(tabId("bb-pane", "source")).toBe("bb-pane-tab-source");
    expect(tabPanelId("bb-pane", "source")).toBe("bb-pane-panel-source");
  });
});
