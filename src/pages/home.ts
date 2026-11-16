import { courses } from "../content";
import { el } from "../lib/dom";
import { icon } from "../lib/icons";
import { navigate } from "../lib/router";
import { courseProgress, overallProgress, resetProgress } from "../lib/progress";

const sellingPoints = [
  {
    label: "Free",
    detail: "No account, no paywall, no upsell.",
    tone: "selling-point--green",
  },
  {
    label: "Minimal by design",
    detail: "No tracking dashboards, no streaks, no badges.",
    tone: "selling-point--rose",
  },
  {
    label: "Built around concepts",
    detail: "Teaches the idea behind each interview question.",
    tone: "selling-point--ink",
  },
];

export function renderHome(): HTMLElement {
  const root = el("div", { className: "page page-home" });

  const hero = el("section", { className: "hero" });
  const title = el("h1", { className: "page-title hero-title" });
  title.appendChild(document.createTextNode("Data engineering, a "));
  title.appendChild(el("span", { className: "hero-title-accent", text: "crash course" }));
  hero.appendChild(title);
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

  const { visited: overallVisited, total: overallTotal } = overallProgress(courses);
  if (overallVisited > 0) {
    const overallPct = Math.round((overallVisited / overallTotal) * 100);
    const overallWrap = el("div", { className: "progress-meter progress-meter--overall" });
    const overallTrack = el("div", { className: "progress-meter-track" });
    overallTrack.appendChild(el("div", { className: "progress-meter-fill", attrs: { style: `width: ${overallPct}%` } }));
    overallWrap.appendChild(overallTrack);
    overallWrap.appendChild(
      el("span", { className: "progress-meter-label", text: `${overallVisited} / ${overallTotal} topics read overall` }),
    );
    const resetButton = el("button", {
      className: "progress-reset",
      text: "Reset progress",
      attrs: { type: "button" },
    });
    resetButton.addEventListener("click", () => {
      if (window.confirm("Reset your reading progress on this device? This can't be undone.")) {
        resetProgress();
        window.location.reload();
      }
    });
    overallWrap.appendChild(resetButton);
    root.appendChild(overallWrap);
  }

  const gridHeading = el("div", { className: "grid-heading" });
  const gridTitle = el("h2", { className: "grid-heading-title" });
  gridTitle.appendChild(icon("bolt", "grid-heading-icon"));
  gridTitle.appendChild(document.createTextNode("Choose a topic set"));
  gridHeading.appendChild(gridTitle);
  gridHeading.appendChild(
    el("p", { className: "grid-heading-subtitle", text: "Eleven topic sets, same format: taught concept, worked example, self-test." }),
  );
  root.appendChild(gridHeading);

  const grid = el("div", { className: "tile-grid" });

  for (const course of courses) {
    const tile = el("button", { className: "tile" });

    tile.appendChild(el("h2", { className: "tile-title", text: course.title }));
    tile.appendChild(el("p", { className: "tile-description", text: course.shortDescription }));

    const cta = el("span", { className: "tile-cta", text: "Start reading \u2192" });
    tile.appendChild(cta);

    const { visited, total } = courseProgress(course);
    if (visited > 0) {
      const pct = Math.round((visited / total) * 100);
      const tileProgress = el("div", { className: "tile-progress" });
      const tileTrack = el("div", { className: "tile-progress-track" });
      tileTrack.appendChild(el("div", { className: "tile-progress-fill", attrs: { style: `width: ${pct}%` } }));
      tileProgress.appendChild(tileTrack);
      tileProgress.appendChild(el("span", { className: "tile-progress-label", text: `${visited}/${total}` }));
      tile.appendChild(tileProgress);
    }

    tile.addEventListener("click", () => navigate({ name: "topic-list", courseId: course.id }));
    grid.appendChild(tile);
  }

  root.appendChild(grid);
  return root;
}
