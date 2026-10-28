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

  const items = FINISHES.map((finish) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "finish-swatch";
    btn.dataset.finish = finish.name;
    btn.style.setProperty("--sw", finish.hex);
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", finish.name);
    btn.tabIndex = -1; // roving tabindex — see syncTabStop()

    const label = document.createElement("span");
    label.className = "finish-name";
    label.textContent = finish.name;
    btn.appendChild(label);

    btn.addEventListener("click", () => select(finish, btn));
    root.appendChild(btn);
    return { finish, btn };
  });

  function select(finish, btn) {
    scene.setColor(hexToRgb(finish.hex));
    items.forEach(({ btn: b }) => b.setAttribute("aria-pressed", "false"));
    btn.setAttribute("aria-pressed", "true");
    selectedBtn = btn;
    syncTabStop();
  }

  // Roving tabindex (APG radio-group pattern): exactly one swatch is a tab
  // stop — the selected one, or the first until something is picked.
  function syncTabStop() {
    const target = selectedBtn ?? items[0].btn;
    items.forEach(({ btn }) => {
      btn.tabIndex = btn === target ? 0 : -1;
    });
  }
  syncTabStop();

  // ArrowLeft/ArrowRight (plus ArrowUp/ArrowDown) and Home/End move focus
  // AND selection, like a radio group. Enter/Space are left to native
  // button activation, exactly as before.
  root.addEventListener("keydown", (e) => {
    const idx = items.findIndex(({ btn }) => btn === e.target);
    if (idx === -1) return;
    const n = items.length;
    let next = null;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = (idx + 1) % n;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = (idx - 1 + n) % n;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = n - 1;
        break;
      default:
        return;
    }
    e.preventDefault(); // don't scroll the page / jump to the top
    const { finish, btn } = items[next];
    btn.focus();
    select(finish, btn);
  });

  return {
    count: items.length,
    selected: () => selectedBtn,
  };
}
