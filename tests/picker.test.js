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

describe("createFinishPicker — keyboard navigation (issue #8)", () => {
  let root, scene, btns;

  function key(btn, k) {
    btn.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  }

  beforeEach(() => {
    document.body.innerHTML = "";
    root = document.createElement("div");
    root.className = "finish-picker";
    document.body.appendChild(root);
    scene = { setColor: vi.fn() };
    createFinishPicker({ root, scene });
    btns = [...root.querySelectorAll(".finish-swatch")];
  });

  it("uses a roving tabindex: only the first swatch is a tab stop before any pick", () => {
    const stops = btns.filter((b) => b.tabIndex === 0);
    expect(stops).toHaveLength(1);
    expect(stops[0]).toBe(btns[0]);
  });

  it("ArrowRight moves focus and selection to the next swatch", () => {
    btns[0].focus();
    key(btns[0], "ArrowRight");
    expect(document.activeElement).toBe(btns[1]);
    expect(btns[1].getAttribute("aria-pressed")).toBe("true");
    expect(scene.setColor).toHaveBeenCalledTimes(1);
  });

  it("ArrowLeft moves backwards and wraps to the last swatch", () => {
    btns[0].focus();
    key(btns[0], "ArrowLeft");
    expect(document.activeElement).toBe(btns[5]);
    expect(btns[5].getAttribute("aria-pressed")).toBe("true");
  });

  it("ArrowRight wraps from the last swatch back to the first", () => {
    btns[5].focus();
    key(btns[5], "ArrowRight");
    expect(document.activeElement).toBe(btns[0]);
    expect(btns[0].getAttribute("aria-pressed")).toBe("true");
  });

  it("ArrowUp/ArrowDown behave like ArrowLeft/ArrowRight", () => {
    btns[2].focus();
    key(btns[2], "ArrowDown");
    expect(document.activeElement).toBe(btns[3]);
    key(btns[3], "ArrowUp");
    expect(document.activeElement).toBe(btns[2]);
  });

  it("Home jumps to the first swatch, End to the last", () => {
    btns[3].focus();
    key(btns[3], "Home");
    expect(document.activeElement).toBe(btns[0]);
    expect(btns[0].getAttribute("aria-pressed")).toBe("true");
    key(btns[0], "End");
    expect(document.activeElement).toBe(btns[5]);
    expect(btns[5].getAttribute("aria-pressed")).toBe("true");
  });

  it("the selected swatch becomes the roving tab stop after a pick", () => {
    btns[3].click();
    const stops = btns.filter((b) => b.tabIndex === 0);
    expect(stops).toHaveLength(1);
    expect(stops[0]).toBe(btns[3]);
    expect(btns[0].tabIndex).toBe(-1);
  });

  it("arrow keys never leave the group and prevent page scroll", () => {
    btns[5].focus();
    const e = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true });
    btns[5].dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(btns[0]);
  });

  it("Enter/Space are not hijacked — native button activation still works", () => {
    btns[2].focus();
    const before = scene.setColor.mock.calls.length;
    key(btns[2], "Enter");
    key(btns[2], " ");
    // The picker's keydown handler must not react to activation keys…
    expect(scene.setColor.mock.calls.length).toBe(before);
    expect(document.activeElement).toBe(btns[2]);
    // …and the button still activates on click as before.
    btns[2].click();
    expect(scene.setColor).toHaveBeenCalledTimes(before + 1);
  });

  it("arrow keys aimed at the root (no swatch focused) do nothing", () => {
    const e = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true });
    root.dispatchEvent(e);
    expect(scene.setColor).not.toHaveBeenCalled();
    expect(e.defaultPrevented).toBe(false);
  });
});
