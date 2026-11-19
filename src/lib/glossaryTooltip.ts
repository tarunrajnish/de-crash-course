import { glossary, termDefinition, type GlossaryTerm } from "../content/glossary";

export function initGlossaryTooltips(): () => void {
  const tooltip = document.createElement("div");
  tooltip.id = "glossary-tooltip";
  tooltip.className = "glossary-tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.hidden = true;
  const label = document.createElement("strong");
  const definition = document.createElement("p");
  tooltip.append(label, definition);
  document.body.appendChild(tooltip);

  let active: HTMLButtonElement | null = null;
  let pinned = false;
  let tooltipHovered = false;
  let closeTimer: number | undefined;

  function cancelClose() {
    window.clearTimeout(closeTimer);
  }

  function close() {
    cancelClose();
    if (active) {
      const descriptions = (active.getAttribute("aria-describedby") ?? "")
        .split(/\s+/).filter(id => id && id !== tooltip.id);
      if (descriptions.length) active.setAttribute("aria-describedby", descriptions.join(" "));
      else active.removeAttribute("aria-describedby");
      active.classList.remove("glossary-term--active");
    }
    active = null;
    pinned = false;
    tooltipHovered = false;
    tooltip.hidden = true;
  }

  function triggerFrom(target: EventTarget | null): HTMLButtonElement | null {
    const trigger = target instanceof Element ? target.closest<HTMLButtonElement>("button.glossary-term") : null;
    const term = trigger?.dataset.glossaryTerm;
    return term && Object.hasOwn(glossary, term) ? trigger : null;
  }

  function contains(target: EventTarget | null): boolean {
    return target instanceof Node && !!(active?.contains(target) || tooltip.contains(target));
  }

  function open(trigger: HTMLButtonElement) {
    cancelClose();
    if (active === trigger) return;
    close();
    active = trigger;
    const term = trigger.dataset.glossaryTerm as GlossaryTerm;
    label.textContent = term;
    definition.textContent = termDefinition(term).definition;
    tooltip.hidden = false;
    active.classList.add("glossary-term--active");
    const descriptions = new Set((active.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    descriptions.add(tooltip.id);
    active.setAttribute("aria-describedby", [...descriptions].join(" "));

    const margin = 12;
    const gap = 8;
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
    const anchor = active.getBoundingClientRect();
    const box = tooltip.getBoundingClientRect();
    const left = Math.max(margin, Math.min(anchor.left, viewportWidth - box.width - margin));
    const below = anchor.bottom + gap;
    const above = anchor.top - box.height - gap;
    const preferred = below + box.height <= viewportHeight - margin ? below : above;
    const top = Math.max(margin, Math.min(preferred, viewportHeight - box.height - margin));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function scheduleClose() {
    cancelClose();
    if (pinned || active === document.activeElement) return;
    closeTimer = window.setTimeout(close, 180);
  }

  function onPointerOver(event: PointerEvent) {
    if (event.pointerType === "touch") return;
    if (event.target instanceof Node && tooltip.contains(event.target)) {
      tooltipHovered = true;
      cancelClose();
      return;
    }
    const trigger = triggerFrom(event.target);
    if (trigger) open(trigger);
    else if (contains(event.target)) cancelClose();
  }

  function onPointerOut(event: PointerEvent) {
    if (event.target instanceof Node && tooltip.contains(event.target)
      && !(event.relatedTarget instanceof Node && tooltip.contains(event.relatedTarget))) {
      tooltipHovered = false;
    }
    if (contains(event.target) && !contains(event.relatedTarget)) scheduleClose();
  }

  function onFocusIn(event: FocusEvent) {
    const trigger = triggerFrom(event.target);
    if (trigger) open(trigger);
  }

  function onFocusOut(event: FocusEvent) {
    if (active?.contains(event.target as Node) && !contains(event.relatedTarget) && !tooltipHovered) close();
  }

  function onClick(event: MouseEvent) {
    const trigger = triggerFrom(event.target);
    if (trigger) {
      if (active === trigger && pinned) close();
      else {
        open(trigger);
        pinned = true;
      }
    } else if (!contains(event.target)) close();
  }

  function onPointerDown(event: PointerEvent) {
    if (event.target instanceof Node && tooltip.contains(event.target)) tooltipHovered = true;
    if (!contains(event.target)) close();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (active && event.key === "Escape") {
      close();
      event.preventDefault();
    }
  }

  function onScroll(event: Event) {
    if (!(event.target instanceof Node && tooltip.contains(event.target))) close();
  }

  document.addEventListener("pointerover", onPointerOver);
  document.addEventListener("pointerout", onPointerOut);
  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("focusout", onFocusOut);
  document.addEventListener("click", onClick);
  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("keydown", onKeyDown);
  window.addEventListener("scroll", onScroll, true);
  window.addEventListener("resize", close);

  return () => {
    close();
    tooltip.remove();
    document.removeEventListener("pointerover", onPointerOver);
    document.removeEventListener("pointerout", onPointerOut);
    document.removeEventListener("focusin", onFocusIn);
    document.removeEventListener("focusout", onFocusOut);
    document.removeEventListener("click", onClick);
    document.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("scroll", onScroll, true);
    window.removeEventListener("resize", close);
  };
}
