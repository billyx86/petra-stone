// Integration test for issue #9: import the real app.js against the real
// index.html under jsdom (no WebGL here) and verify the acceptance
// criteria from the issue — the page still works, canvases become labelled
// placeholders, and there is no console-visible crash.
//
// jsdom lacks IntersectionObserver and canvas 2d/webgl contexts; both are
// stubbed before the dynamic import so app.js's top-level module code runs
// to completion. three.js is aliased to tests/stubs via vitest.config.js.
import { describe, it, expect, beforeAll, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CANVAS_IDS = [
  "heroCanvas",
  "petraCanvas",
  "airCanvas",
  "proCanvas",
  "ultraCanvas",
];

describe("app.js without WebGL (issue #9 acceptance)", () => {
  beforeAll(async () => {
    // jsdom has no IntersectionObserver (scroll reveal, scene visibility).
    globalThis.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    };
    // jsdom has no matchMedia (prefers-reduced-motion check at app start).
    window.matchMedia = () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    });
    // jsdom has no canvas 2d/webgl backends: make getContext return null
    // silently so detectWebGL() reports "unavailable" deterministically.
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null);

    const html = readFileSync(path.join(root, "index.html"), "utf8");
    const doc = new DOMParser().parseFromString(html, "text/html");
    document.body.innerHTML = doc.body.innerHTML;

    const errors = [];
    const onConsoleError = (e) => errors.push(e);
    window.addEventListener("error", onConsoleError);

    try {
      await import("../app.js");
    } finally {
      window.removeEventListener("error", onConsoleError);
    }
    expect(errors, "no uncaught errors while app.js initialised").toEqual([]);
  });

  it("every canvas was swapped for a labelled placeholder in its parent", () => {
    for (const canvasId of CANVAS_IDS) {
      const canvas = document.getElementById(canvasId);
      expect(canvas, canvasId).not.toBeNull();
      const parent = canvas.parentElement;
      expect(parent, `${canvasId} has a parent`).not.toBeNull();
      expect(parent.querySelector(".webgl-fallback-inner"), `${canvasId} placeholder is in its parent`).not.toBeNull();
      expect(parent.classList.contains("webgl-fallback"), canvasId).toBe(true);

      const inner = parent.querySelector(".webgl-fallback-inner");
      expect(inner.getAttribute("role")).toBe("img");
      expect(inner.getAttribute("aria-label")).toMatch(/3D preview unavailable/);
      expect(inner.querySelector(".webgl-fallback-rock")).not.toBeNull();
      expect(inner.querySelector(".webgl-fallback-detail").textContent.length).toBeGreaterThan(10);

      expect(canvas.style.visibility, `${canvasId} canvas hidden`).toBe("hidden");
    }
  });

  it("the hero drag hint was removed — there is nothing to drag", () => {
    expect(document.getElementById("dragHint")).toBeNull();
  });

  it("the mobile menu still works", () => {
    const toggle = document.getElementById("menuToggle");
    const panel = document.getElementById("mobileMenu");
    toggle.click();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(panel.classList.contains("open")).toBe(true);
    toggle.click();
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(panel.classList.contains("open")).toBe(false);
  });

  it("the buy toast still works", () => {
    const toast = document.getElementById("toast");
    const buy = document.querySelector(".btn-primary");
    expect(buy).not.toBeNull();
    buy.click();
    expect(toast.classList.contains("show")).toBe(true);
  });

  it("the finish picker still renders and is operable without a scene", () => {
    const picker = document.getElementById("finishPicker");
    const swatches = picker.querySelectorAll(".finish-swatch");
    expect(swatches).toHaveLength(6);
    const red = [...swatches].find((b) => b.dataset.finish === "Product Red");
    red.click();
    expect(red.getAttribute("aria-pressed")).toBe("true");
    // Keyboard navigation (issue #8) works in the no-WebGL page too.
    red.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true })
    );
    const green = [...swatches].find((b) => b.dataset.finish === "Alpine Green");
    expect(document.activeElement).toBe(green);
    expect(green.getAttribute("aria-pressed")).toBe("true");
  });

  it("no WebGL scenes were attempted", () => {
    // detectWebGL() saw no context; the three.js stubs throw if touched.
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();
    expect(window.__hero).toBeNull();
  });
});
