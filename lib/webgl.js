// WebGL availability + graceful fallback for the canvas scenes (issue #9).
//
// No three.js import here on purpose: this module is pure DOM so the whole
// failure path (detection, placeholder, context loss) runs under jsdom.
// app.js does the wiring and owns the three.js scene lifecycle.

export function detectWebGL() {
  if (typeof document === "undefined") return false;
  try {
    const probe = document.createElement("canvas");
    const gl =
      probe.getContext("webgl2") ||
      probe.getContext("webgl") ||
      probe.getContext("experimental-webgl");
    return Boolean(gl);
  } catch {
    // A broken GPU driver can make getContext() throw; treat as absent.
    return false;
  }
}

// Builds the static placeholder that replaces a dead/unavailable canvas.
// The parent keeps its own size; the placeholder centres inside it. Calling
// this twice replaces the previous placeholder rather than stacking them.
export function renderFallback(parent, { title, detail } = {}) {
  const existing = parent.querySelector(".webgl-fallback-inner");
  if (existing) existing.remove();

  parent.classList.add("webgl-fallback");

  const node = document.createElement("div");
  node.className = "webgl-fallback-inner";
  node.setAttribute("role", "img"); // decorative placeholder, labelled
  node.setAttribute("aria-label", title);

  const rock = document.createElement("div");
  rock.className = "webgl-fallback-rock";
  rock.setAttribute("aria-hidden", "true");

  const h = document.createElement("p");
  h.className = "webgl-fallback-title";
  h.textContent = title;

  const p = document.createElement("p");
  p.className = "webgl-fallback-detail";
  p.textContent = detail;

  node.append(rock, h, p);
  parent.appendChild(node);
  return node;
}

// Listens for the canvas losing its WebGL context (driver crash, memory
// pressure, laptop GPU switchover). Returns an unsubscribe function.
// The caller decides the recovery strategy; the contract here is only:
// preventDefault() the lost event (we handle it) and invoke onLost.
export function installContextLossHandlers(canvas, onLost) {
  const onLostEvent = (e) => {
    e.preventDefault();
    onLost(e);
  };
  canvas.addEventListener("webglcontextlost", onLostEvent);
  return () => canvas.removeEventListener("webglcontextlost", onLostEvent);
}
