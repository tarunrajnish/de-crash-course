import { courses } from "../content";
import { el } from "../lib/dom";
import { icon } from "../lib/icons";
import { routeToPath } from "../lib/router";
import { courseProgress, overallProgress, resetProgress } from "../lib/progress";
import { addProgressNotice } from "../lib/progressNotice";
import { readingTimeLabel, READING_TIME_DESCRIPTION } from "../lib/readingTime";

const sellingPoints = [
  {
    label: "Free",
    tone: "selling-point--green",
  },
  {
    label: "Minimal by design",
    tone: "selling-point--rose",
  },
  {
    label: "Built around concepts",
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
    pointsRow.appendChild(item);
  }
  root.appendChild(pointsRow);

  root.appendChild(el("div", { className: "section-divider" }));

  const overall = overallProgress(courses);
  const { visited: overallVisited, total: overallTotal } = overall;
  const overallWrap = el("div", {
    className: "progress-meter progress-meter--overall",
  });
  const overallTrack = el("progress", {
    className: "progress-meter-track",
    attrs: { value: String(overallVisited), max: String(overallTotal || 1), "aria-label": "Topics read overall" },
  });
  overallWrap.appendChild(overallTrack);
  overallWrap.appendChild(
    el("span", { className: "progress-meter-label", text: `${overallVisited} / ${overallTotal} topics read overall` }),
  );
  overallWrap.appendChild(el("span", {
    className: "reading-time-estimate",
    text: readingTimeLabel(overall.remainingMinutes, overall.totalMinutes),
    attrs: { title: READING_TIME_DESCRIPTION },
  }));
  if (overallVisited > 0) {
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
  }
  addProgressNotice(overallWrap);
  root.appendChild(overallWrap);

  const gridHeading = el("div", { className: "grid-heading" });
  const gridTitle = el("h2", { className: "grid-heading-title" });
  gridTitle.appendChild(icon("bolt", "grid-heading-icon"));
  gridTitle.appendChild(document.createTextNode("Choose a topic set"));
  gridHeading.appendChild(gridTitle);
  gridHeading.appendChild(
    el("p", { className: "grid-heading-subtitle", text: `${courses.length} topic sets, same format: taught concept, worked example, self-test.` }),
  );
  root.appendChild(gridHeading);

  const grid = el("div", { className: "tile-grid" });

  for (const course of courses) {
    const tile = el("a", {
      className: "tile",
      attrs: { href: routeToPath({ name: "topic-list", courseId: course.id }) },
    });

    tile.appendChild(el("h2", { className: "tile-title", text: course.title }));
    tile.appendChild(el("p", { className: "tile-description", text: course.shortDescription }));

    const cta = el("span", { className: "tile-cta", text: "Start reading \u2192" });
    tile.appendChild(cta);

    const progress = courseProgress(course);
    const { visited, total } = progress;
    const tileProgress = el("div", {
      className: "tile-progress",
    });
    const tileTrack = el("progress", {
      className: "tile-progress-track",
      attrs: { value: String(visited), max: String(total || 1), "aria-label": `${course.title}: topics read` },
    });
    tileProgress.appendChild(tileTrack);
    tileProgress.appendChild(el("span", { className: "tile-progress-label", text: `${visited}/${total}` }));
    tileProgress.appendChild(el("span", {
      className: "reading-time-estimate",
      text: readingTimeLabel(progress.remainingMinutes, progress.totalMinutes),
      attrs: { title: READING_TIME_DESCRIPTION },
    }));
    tile.appendChild(tileProgress);

    grid.appendChild(tile);
  }

  root.appendChild(grid);
  return root;
}
