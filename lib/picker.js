// Finish picker: renders one <button> swatch per finish and drives the
// 3D scene's setColor() on pick. Kept free of Three.js so it runs under
// jsdom — the scene only has to expose setColor(hexNumber).
import { FINISHES } from "./finishes.js";

export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return (
    parseInt(h.slice(0, 2), 16) * 0x10000 +
    parseInt(h.slice(2, 4), 16) * 0x100 +
    parseInt(h.slice(4, 6), 16)
  );
}

export function createFinishPicker({ root, scene }) {
  if (!root) throw new Error("finish picker needs a root element");

  let selectedBtn = null;

  function select(finish, btn) {
    scene.setColor(hexToRgb(finish.hex));
    root.querySelectorAll(".finish-swatch").forEach((b) => b.setAttribute("aria-pressed", "false"));
    btn.setAttribute("aria-pressed", "true");
    selectedBtn = btn;
  }

  for (const finish of FINISHES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "finish-swatch";
    btn.dataset.finish = finish.name;
    btn.style.setProperty("--sw", finish.hex);
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", finish.name);

    const label = document.createElement("span");
    label.className = "finish-name";
    label.textContent = finish.name;
    btn.appendChild(label);

    btn.addEventListener("click", () => select(finish, btn));
    root.appendChild(btn);
  }

  return {
    count: root.querySelectorAll(".finish-swatch").length,
    selected: () => selectedBtn,
  };
}
