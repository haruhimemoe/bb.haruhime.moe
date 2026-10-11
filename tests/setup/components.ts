/**
 * @file tests/setup/components.ts
 * @desc Setup for the jsdom "components" project: jest-dom matchers, DOM cleanup between tests,
 *       the Range measurements CodeMirror asks for (jsdom doesn't have them), and enough of
 *       <dialog>'s showModal/close for ui's ConfirmDialog (jsdom has neither), and next-intl
 *       translating from the English catalogs.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, vi } from "vitest";

const noRects = (): DOMRectList =>
  Object.assign([], { item: () => null }) as unknown as DOMRectList;
Range.prototype.getBoundingClientRect = () => new DOMRect();
Range.prototype.getClientRects = noRects;

// jsdom has no showModal/close on <dialog>. Enough of them for ui's ConfirmDialog.
const proto = globalThis.HTMLDialogElement?.prototype;
if (proto && typeof proto.showModal !== "function") {
  proto.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  proto.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}

afterEach(() => {
  cleanup();
});

// next-intl outside Next: useTranslations and getTranslations translate from the English
// catalogs of @haruhimemoe/messages, so components render what the site shows in English.
const intl = vi.hoisted(() => ({ messages: {} as Record<string, unknown> }));
vi.mock("next-intl", async (original) => {
  const actual = await original<typeof import("next-intl")>();
  const translator = (namespace?: string) =>
    actual.createTranslator({ locale: "en", messages: intl.messages, namespace } as never);
  return {
    ...actual,
    useTranslations: translator,
    useLocale: () => "en",
    NextIntlClientProvider: ({ children }: { children: unknown }) => children,
  };
});
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  return {
    getTranslations: async (namespace?: string | { namespace?: string }) =>
      createTranslator({
        locale: "en",
        messages: intl.messages,
        namespace: typeof namespace === "string" ? namespace : namespace?.namespace,
      } as never),
    getLocale: async () => "en",
  };
});
beforeAll(async () => {
  const { loadMessages, NAMESPACES } = await import("@haruhimemoe/messages");
  for (const namespace of NAMESPACES)
    Object.assign(intl.messages, await loadMessages("en", namespace));
});
