/**
 * @file tests/setup/components.ts
 * @desc Setup for the jsdom "components" project: jest-dom matchers, DOM cleanup between tests,
 *       and the Range measurements CodeMirror asks for, which jsdom doesn't have.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

const noRects = (): DOMRectList =>
  Object.assign([], { item: () => null }) as unknown as DOMRectList;
Range.prototype.getBoundingClientRect = () => new DOMRect();
Range.prototype.getClientRects = noRects;

afterEach(() => {
  cleanup();
});
