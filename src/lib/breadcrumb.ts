import type { Route } from "./router";
import { routeToPath } from "./router";
import { el } from "./dom";

interface Crumb {
  label: string;
  route: Route;
}

export function breadcrumb(crumbs: Crumb[]): HTMLElement {
  const nav = el("nav", {
    className: "breadcrumb",
    attrs: {
      "aria-label": "Breadcrumb",
      itemscope: "",
      itemtype: "https://schema.org/BreadcrumbList",
    },
  });
  crumbs.forEach((crumb, i) => {
    const isLast = i === crumbs.length - 1;
    const item = el("span", {
      attrs: {
        itemprop: "itemListElement",
        itemscope: "",
        itemtype: "https://schema.org/ListItem",
      },
    });
    if (isLast) {
      item.appendChild(el("span", {
        className: "breadcrumb-current",
        text: crumb.label,
        attrs: { itemprop: "name" },
      }));
    } else {
      item.appendChild(el("a", {
        className: "breadcrumb-link",
        attrs: {
          href: routeToPath(crumb.route),
          itemprop: "item",
          itemscope: "",
          itemtype: "https://schema.org/WebPage",
        },
      }, [
        el("span", { text: crumb.label, attrs: { itemprop: "name" } }),
      ]));
    }
    item.appendChild(el("meta", {
      attrs: { itemprop: "position", content: String(i + 1) },
    }));
    nav.appendChild(item);
    if (!isLast) {
      nav.appendChild(el("span", { className: "breadcrumb-sep", text: "/" }));
    }
  });
  return nav;
}

export function backButton(route: Route, label = "Back"): HTMLElement {
  const btn = el("a", {
    className: "back-button",
    text: `\u2190 ${label}`,
    attrs: { href: routeToPath(route) },
  });
  return btn;
}
