// Mobile menu controller. Owns all state for the hamburger panel so the
// behaviour (ARIA wiring, focus return, Escape, outside-click) is unit
// testable under jsdom without the 3D scenes.
export function createMenuController({ toggle, panel }) {
  if (!toggle || !panel) throw new Error("menu controller needs a toggle button and a panel");

  let open = false;

  function setOpen(next) {
    open = next;
    toggle.setAttribute("aria-expanded", String(next));
    panel.setAttribute("aria-hidden", String(!next));
    toggle.classList.toggle("open", next);
    panel.classList.toggle("open", next);
    document.body.style.overflow = next ? "hidden" : "";
  }

  function toggleOpen() {
    setOpen(!open);
  }

  function close() {
    if (!open) return;
    setOpen(false);
    // Return keyboard focus to the toggle when the menu closes.
    if (typeof toggle.focus === "function") {
      toggle.focus({ preventScroll: true });
    }
  }

  const handleToggleClick = () => toggleOpen();

  const handleKeydown = (e) => {
    if (e.key === "Escape") close();
  };

  const handleDocumentClick = (e) => {
    if (!open) return;
    if (panel.contains(e.target) || toggle.contains(e.target)) return;
    close();
  };

  function bind() {
    // Initialise ARIA state before first interaction.
    toggle.setAttribute("aria-expanded", "false");
    panel.setAttribute("aria-hidden", "true");
    toggle.addEventListener("click", handleToggleClick);
    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("click", handleDocumentClick);
    panel.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
  }

  return {
    isOpen: () => open,
    open: () => setOpen(true),
    close,
    toggleOpen,
    bind,
  };
}
