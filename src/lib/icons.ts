// Small decorative line-icons used sparingly around the site to nod at the
// subject matter (lightning for Spark, a funnel for transforms, stacked
// layers for Delta Lake, a wave for streaming, etc). Single-color, inherits
// `currentColor` so it follows whatever text/accent color the caller sets.

const PATHS: Record<string, string> = {
  bolt: '<path d="M12.5 2 4 13h6l-1.5 9L20 11h-6.5z" />',
  funnel: '<path d="M3 4h18l-6.5 8.5v6l-5 2.5v-8.5z" />',
  layers: '<path d="M12 3 2 8l10 5 10-5z" /><path d="M2 13l10 5 10-5" />',
  wave: '<path d="M2 15c2.5 0 2.5-4 5-4s2.5 4 5 4 2.5-4 5-4 2.5 4 5 4" />',
  database:
    '<ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />' +
    '<path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />',
  gear:
    '<circle cx="12" cy="12" r="3" />' +
    '<path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />',
  shield: '<path d="M12 2l8 3.5v6c0 5-3.4 8.4-8 10.5-4.6-2.1-8-5.5-8-10.5v-6z" /><path d="M8.5 12l2.3 2.3L15.5 9.5" />',
  compass: '<circle cx="12" cy="12" r="9" /><path d="M15 9l-2 6-4.5 1.5L10.5 10.5z" />',
  chip:
    '<rect x="7" y="7" width="10" height="10" rx="1.5" /><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />',
  cube: '<path d="M12 2 3 7v10l9 5 9-5V7z" /><path d="M3 7l9 5 9-5M12 12v10" />',
  radar: '<circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><path d="M12 12 18 6" />',
  link: '<path d="M9 15l6-6" /><path d="M8.5 16.5l-2 2a3 3 0 0 1-4.2-4.2l3-3a3 3 0 0 1 4.2 0" />' +
    '<path d="M15.5 7.5l2-2a3 3 0 0 1 4.2 4.2l-3 3a3 3 0 0 1-4.2 0" />',
  magnifier: '<circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-5-5" />',
  copy: '<rect x="9" y="9" width="12" height="12" rx="1.5" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />',
  check: '<path d="M5 12.5l4.5 4.5L19 7" />',
};

export function icon(name: keyof typeof PATHS, className = ""): HTMLElement {
  const span = document.createElement("span");
  span.className = `icon icon-${name}${className ? ` ${className}` : ""}`;
  span.innerHTML =
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ` +
    `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name]}</svg>`;
  return span;
}

export const TOPIC_ICONS: Array<keyof typeof PATHS> = [
  "bolt",
  "funnel",
  "layers",
  "wave",
  "database",
  "gear",
  "shield",
  "compass",
  "chip",
  "cube",
  "radar",
  "magnifier",
];
