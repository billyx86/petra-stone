import { describe, it, expect, beforeEach, vi } from "vitest";
import { createFinishPicker, hexToRgb } from "../lib/picker.js";

describe("hexToRgb", () => {
  it("converts #rrggbb to the 0xRRGGBB number three.js expects", () => {
    expect(hexToRgb("#1d1d1f")).toBe(0x1d1d1f);
    expect(hexToRgb("#f5f5f7")).toBe(0xf5f5f7);
    expect(hexToRgb("#bf0a30")).toBe(0xbf0a30);
    expect(hexToRgb("#ffffff")).toBe(0xffffff);
  });
});

describe("createFinishPicker", () => {
  let root, scene;

  beforeEach(() => {
    document.body.innerHTML = "";
    root = document.createElement("div");
    root.className = "finish-picker";
    document.body.appendChild(root);
    scene = { setColor: vi.fn() };
  });

  it("renders one swatch per finish (six)", () => {
    const picker = createFinishPicker({ root, scene });
    expect(picker.count).toBe(6);
  });

  it("throws without a root element", () => {
    expect(() => createFinishPicker({ root: null, scene })).toThrow();
  });

  it("each swatch is a real, labelled, unpressed button", () => {
    createFinishPicker({ root, scene });
    const btns = root.querySelectorAll(".finish-swatch");
    btns.forEach((b) => {
      expect(b.tagName).toBe("BUTTON");
      expect(b.getAttribute("aria-pressed")).toBe("false");
      expect(b.getAttribute("aria-label")).toBeTruthy();
      expect(b.style.getPropertyValue("--sw")).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  it("calls setColor with the chosen finish and marks it pressed", () => {
    const picker = createFinishPicker({ root, scene });
    const btns = [...root.querySelectorAll(".finish-swatch")];
    const target = btns.find((b) => b.dataset.finish === "Product Red");
    target.click();

    expect(scene.setColor).toHaveBeenCalledTimes(1);
    expect(scene.setColor).toHaveBeenCalledWith(hexToRgb("#bf0a30"));
    expect(target.getAttribute("aria-pressed")).toBe("true");
    expect(picker.selected()).toBe(target);
  });

  it("only one swatch is pressed at a time", () => {
    createFinishPicker({ root, scene });
    const btns = [...root.querySelectorAll(".finish-swatch")];
    btns[0].click();
    btns[3].click();
    const pressed = root.querySelectorAll('.finish-swatch[aria-pressed="true"]');
    expect(pressed).toHaveLength(1);
    expect(pressed[0]).toBe(btns[3]);
  });

  it("switching finish re-tints the scene again", () => {
    createFinishPicker({ root, scene });
    const btns = [...root.querySelectorAll(".finish-swatch")];
    btns[0].click();
    btns[5].click();
    expect(scene.setColor).toHaveBeenCalledTimes(2);
    const expected = btns[5].style.getPropertyValue("--sw");
    expect(scene.setColor).toHaveBeenLastCalledWith(hexToRgb(expected));
  });
});
