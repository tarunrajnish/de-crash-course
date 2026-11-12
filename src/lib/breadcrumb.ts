import type { Route } from "./router";
import { navigate } from "./router";
import { el } from "./dom";

interface Crumb {
  label: string;
  route: Route;
}

export function breadcrumb(crumbs: Crumb[]): HTMLElement {
  const nav = el("nav", { className: "breadcrumb", attrs: { "aria-label": "breadcrumb" } });
  crumbs.forEach((crumb, i) => {
    const isLast = i === crumbs.length - 1;
    if (isLast) {
      nav.appendChild(el("span", { className: "breadcrumb-current", text: crumb.label }));
    } else {
      const link = el("button", { className: "breadcrumb-link", text: crumb.label });
      link.addEventListener("click", () => navigate(crumb.route));
      nav.appendChild(link);
      nav.appendChild(el("span", { className: "breadcrumb-sep", text: "/" }));
    }
  });
  return nav;
}

export function backButton(route: Route, label = "Back"): HTMLElement {
  const btn = el("button", { className: "back-button", text: `\u2190 ${label}` });
  btn.addEventListener("click", () => navigate(route));
  return btn;
}
