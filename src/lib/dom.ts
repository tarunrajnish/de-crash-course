export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options?: { className?: string; text?: string; attrs?: Record<string, string> },
  children?: (Node | string)[],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (options?.className) node.className = options.className;
  if (options?.text !== undefined) node.textContent = options.text;
  if (options?.attrs) {
    for (const [k, v] of Object.entries(options.attrs)) node.setAttribute(k, v);
  }
  if (children) {
    for (const child of children) {
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    }
  }
  return node;
}

export function clear(node: HTMLElement) {
  while (node.firstChild) node.removeChild(node.firstChild);
}
