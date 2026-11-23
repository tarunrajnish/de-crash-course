const MIN_SHEET_FONT = 5.5;

// Picks the largest font size at which every column fits on one screen.
export function fitSheet(body: HTMLElement, maxFont = 16): void {
  if (!body.clientWidth) return;
  body.style.overflowX = "hidden";
  let size = maxFont;
  for (; size > MIN_SHEET_FONT; size -= 0.25) {
    body.style.fontSize = `${size}px`;
    if (body.scrollWidth <= body.clientWidth + 1) break;
  }
  body.style.fontSize = `${size}px`;
  if (body.scrollWidth > body.clientWidth + 1) body.style.overflowX = "auto";
}

export function keepSheetFitted(body: HTMLElement, maxFont?: number): void {
  const view = body.ownerDocument.defaultView;
  if (!view) return;
  const fit = () => fitSheet(body, maxFont);
  // The page is not attached yet, and web fonts change text widths, so measure after both.
  view.requestAnimationFrame?.(fit);
  body.ownerDocument.fonts?.ready.then(fit);
  view.addEventListener("resize", fit);
}
