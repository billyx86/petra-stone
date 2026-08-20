import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMenuController } from "../lib/menu.js";

function makeDOM() {
  const toggle = document.createElement("button");
  toggle.setAttribute("aria-label", "Menu");
  const panel = document.createElement("div");
  panel.className = "mobile-menu";
  for (const label of ["Store", "Petra", "Air"]) {
    const a = document.createElement("a");
    a.href = "#" + label.toLowerCase();
    a.textContent = label;
    panel.appendChild(a);
  }
  document.body.appendChild(toggle);
  document.body.appendChild(panel);
  return { toggle, panel };
}

let ctrl;
let dom;

beforeEach(() => {
  document.body.innerHTML = "";
  document.body.style.overflow = "";
  dom = makeDOM();
  ctrl = createMenuController(dom);
  ctrl.bind();
});

describe("createMenuController", () => {
  it("initialises ARIA to the closed state", () => {
    expect(dom.toggle.getAttribute("aria-expanded")).toBe("false");
    expect(dom.panel.getAttribute("aria-hidden")).toBe("true");
    expect(ctrl.isOpen()).toBe(false);
  });

  it("throws when DOM nodes are missing", () => {
    expect(() => createMenuController({ toggle: null, panel: null })).toThrow();
  });

  it("opens on toggle click", () => {
    dom.toggle.click();
    expect(ctrl.isOpen()).toBe(true);
    expect(dom.toggle.getAttribute("aria-expanded")).toBe("true");
    expect(dom.panel.getAttribute("aria-hidden")).toBe("false");
    expect(dom.panel.classList.contains("open")).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("closes again on second toggle click and restores scroll", () => {
    dom.toggle.click();
    dom.toggle.click();
    expect(ctrl.isOpen()).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("closes on Escape and returns focus to the toggle", () => {
    const focusSpy = vi.spyOn(dom.toggle, "focus");
    dom.toggle.click();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(ctrl.isOpen()).toBe(false);
    expect(focusSpy).toHaveBeenCalled();
  });

  it("does not close on Escape while already closed (no focus steal)", () => {
    const focusSpy = vi.spyOn(dom.toggle, "focus");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(focusSpy).not.toHaveBeenCalled();
  });

  it("closes on outside click", () => {
    const outside = document.createElement("div");
    document.body.appendChild(outside);
    dom.toggle.click();
    expect(ctrl.isOpen()).toBe(true);
    outside.click();
    expect(ctrl.isOpen()).toBe(false);
  });

  it("stays open when clicking inside the panel", () => {
    dom.toggle.click();
    dom.panel.firstElementChild.click(); // panel link closes it — simulate a non-link area
    // The panel's own anchors close on click (intended); click on panel padding should not.
    dom.toggle.click();
    const pad = document.createElement("span");
    dom.panel.appendChild(pad);
    pad.click();
    expect(ctrl.isOpen()).toBe(true);
  });

  it("closes when a panel link is followed", () => {
    dom.toggle.click();
    dom.panel.querySelector("a").click();
    expect(ctrl.isOpen()).toBe(false);
  });

  it("ignores unrelated keys", () => {
    dom.toggle.click();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(ctrl.isOpen()).toBe(true);
  });
});
