/**
 * @file tests/components/editor/EditorSettingsTool.test.tsx
 * @desc The editor settings panel: each control reports the whole new settings, and the
 *       toolbar's Settings button opens it.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EditorSettingsTool } from "@/components/editor/EditorSettingsTool";
import { Toolbar } from "@/components/editor/Toolbar";
import { DEFAULT_EDITOR_SETTINGS } from "@/utils/editor-settings";

const setup = () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<EditorSettingsTool settings={DEFAULT_EDITOR_SETTINGS} onChange={onChange} />);
  return { user, onChange };
};

describe("EditorSettingsTool", () => {
  it("changes the font", async () => {
    const { user, onChange } = setup();
    await user.click(screen.getByRole("radio", { name: "Sans (Nunito)" }));
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_EDITOR_SETTINGS, font: "sans" });
  });

  it("changes the text size", async () => {
    const { user, onChange } = setup();
    await user.selectOptions(screen.getByLabelText("Text size"), "18");
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_EDITOR_SETTINGS, size: 18 });
  });

  it("turns typing help off", async () => {
    const { user, onChange } = setup();
    await user.click(screen.getByLabelText("Close tags as I type"));
    expect(onChange).toHaveBeenLastCalledWith({ ...DEFAULT_EDITOR_SETTINGS, autoClose: false });
    await user.click(screen.getByLabelText("Continue lists on Enter"));
    expect(onChange).toHaveBeenLastCalledWith({ ...DEFAULT_EDITOR_SETTINGS, listContinue: false });
  });

  it("opens from the toolbar", async () => {
    const user = userEvent.setup();
    render(
      <Toolbar
        onEdit={vi.fn()}
        selection={() => ""}
        settings={DEFAULT_EDITOR_SETTINGS}
        onSettings={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByRole("form", { name: "Editor settings" })).toBeInTheDocument();
  });
});
