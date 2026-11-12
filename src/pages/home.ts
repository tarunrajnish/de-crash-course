import { courses } from "../content";
import { el } from "../lib/dom";
import { navigate } from "../lib/router";

const sellingPoints = [
  {
    label: "Free",
    detail: "No account, no paywall, no upsell. Everything here stays free.",
    tone: "selling-point--green",
  },
  {
    label: "Minimal by design",
    detail: "No tracking dashboards, no streaks, no badges. Just the material.",
    tone: "selling-point--rose",
  },
  {
    label: "Built around concepts",
    detail: "Each page teaches the idea behind an interview question, with worked examples and a self-test.",
    tone: "selling-point--ink",
  },
];

export function renderHome(): HTMLElement {
  const root = el("div", { className: "page page-home" });

  const hero = el("section", { className: "hero" });
  hero.appendChild(el("h1", { className: "page-title", text: "Data engineering, a crash course" }));
  root.appendChild(hero);

  const pointsRow = el("div", { className: "selling-points" });
  for (const point of sellingPoints) {
    const item = el("div", { className: `selling-point ${point.tone}` });
    item.appendChild(el("h3", { className: "selling-point-label", text: point.label }));
    item.appendChild(el("p", { className: "selling-point-detail", text: point.detail }));
    pointsRow.appendChild(item);
  }
  root.appendChild(pointsRow);

  root.appendChild(el("div", { className: "section-divider" }));

  const gridHeading = el("div", { className: "grid-heading" });
  gridHeading.appendChild(el("h2", { className: "grid-heading-title", text: "Choose a topic set" }));
  gridHeading.appendChild(
    el("p", { className: "grid-heading-subtitle", text: "One is live today, more will follow the same format." }),
  );
  root.appendChild(gridHeading);

  const grid = el("div", { className: "tile-grid" });

  for (const course of courses) {
    const tile = el("button", { className: "tile" });

    tile.appendChild(el("h2", { className: "tile-title", text: course.title }));
    tile.appendChild(el("p", { className: "tile-description", text: course.shortDescription }));

    const cta = el("span", { className: "tile-cta", text: "Start reading \u2192" });
    tile.appendChild(cta);

    tile.addEventListener("click", () => navigate({ name: "topic-list", courseId: course.id }));
    grid.appendChild(tile);
  }

  root.appendChild(grid);
  return root;
}
