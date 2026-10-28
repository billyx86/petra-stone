import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  detectWebGL,
  renderFallback,
  installContextLossHandlers,
} from "../lib/webgl.js";

describe("detectWebGL", () => {
  it("reports a boolean", () => {
    expect(typeof detectWebGL()).toBe("boolean");
  });

  it("is true when a canvas can get a webgl context", () => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ stub: true }));
    try {
      expect(detectWebGL()).toBe(true);
    } finally {
      HTMLCanvasElement.prototype.getContext = orig;
    }
  });

  it("is false when no context type is available (jsdom)", () => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null);
    try {
      expect(detectWebGL()).toBe(false);
    } finally {
      HTMLCanvasElement.prototype.getContext = orig;
    }
  });

  it("treats a throwing getContext (broken driver) as unavailable", () => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn(() => {
      throw new Error("gl driver exploded");
    });
    try {
      expect(detectWebGL()).toBe(false);
    } finally {
      HTMLCanvasElement.prototype.getContext = orig;
    }
  });
});

describe("renderFallback", () => {
  let parent;

  beforeEach(() => {
    document.body.innerHTML = "";
    parent = document.createElement("div");
    document.body.appendChild(parent);
  });

  it("injects a labelled placeholder (rock + title + detail)", () => {
    renderFallback(parent, {
      title: "3D preview unavailable",
      detail: "Your browser could not start WebGL, so here is a very good picture of the rock instead.",
    });

    const node = parent.querySelector(".webgl-fallback-inner");
    expect(node).not.toBeNull();
    expect(node.getAttribute("role")).toBe("img");
    expect(node.getAttribute("aria-label")).toBe("3D preview unavailable");

    expect(parent.querySelector(".webgl-fallback-rock")).not.toBeNull();

    const title = parent.querySelector(".webgl-fallback-title");
    expect(title.textContent).toBe("3D preview unavailable");

    const detail = parent.querySelector(".webgl-fallback-detail");
    expect(detail.textContent).toContain("could not start WebGL");
  });

  it("marks the parent with a webgl-fallback class", () => {
    renderFallback(parent, { title: "t", detail: "d" });
    expect(parent.classList.contains("webgl-fallback")).toBe(true);
  });

  it("does not stack placeholders when called twice", () => {
    renderFallback(parent, { title: "first", detail: "d" });
    renderFallback(parent, { title: "second", detail: "d" });

    const nodes = parent.querySelectorAll(".webgl-fallback-inner");
    expect(nodes).toHaveLength(1);
    expect(nodes[0].getAttribute("aria-label")).toBe("second");
  });

  it("sits alongside existing canvas children without removing them", () => {
    const canvas = document.createElement("canvas");
    parent.appendChild(canvas);
    renderFallback(parent, { title: "t", detail: "d" });
    expect(parent.querySelector("canvas")).toBe(canvas);
    expect(parent.querySelector(".webgl-fallback-inner")).not.toBeNull();
  });
});

describe("installContextLossHandlers", () => {
  let canvas;

  beforeEach(() => {
    document.body.innerHTML = "";
    canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
  });

  it("invokes the handler and preventDefaults the lost event", () => {
    const onLost = vi.fn();
    installContextLossHandlers(canvas, onLost);

    const e = new Event("webglcontextlost", { cancelable: true });
    canvas.dispatchEvent(e);

    expect(onLost).toHaveBeenCalledTimes(1);
    expect(onLost).toHaveBeenCalledWith(e);
    expect(e.defaultPrevented).toBe(true);
  });

  it("does not fire for other canvas events", () => {
    const onLost = vi.fn();
    installContextLossHandlers(canvas, onLost);
    canvas.dispatchEvent(new Event("click"));
    canvas.dispatchEvent(new Event("webglcontextrestored"));
    expect(onLost).not.toHaveBeenCalled();
  });

  it("the unsubscribe function detaches the handler", () => {
    const onLost = vi.fn();
    const unsub = installContextLossHandlers(canvas, onLost);
    unsub();

    const e = new Event("webglcontextlost", { cancelable: true });
    canvas.dispatchEvent(e);

    expect(onLost).not.toHaveBeenCalled();
    expect(e.defaultPrevented).toBe(false);
  });
});
