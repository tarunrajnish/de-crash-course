import { findCourse } from "../content";
import { summaryCards } from "../content/summary";
import { el } from "../lib/dom";
import { keepSheetFitted } from "../lib/fitSheet";
import { renderInlineText } from "../lib/inlineCode";
import { routeToPath } from "../lib/router";

export function renderSummary(): HTMLElement {
  const root = el("div", { className: "page page-cheatsheet cheatsheet-sheet summary-sheet" });
  const controls = el("div", { className: "cheatsheet-controls" });
  controls.appendChild(el("a", {
    className: "cheatsheet-home",
    text: "← Home",
    attrs: { href: routeToPath({ name: "home" }) },
  }));
  controls.appendChild(el("h1", { className: "summary-title", text: "One-page summary" }));
  controls.appendChild(el("p", {
    className: "summary-subtitle",
    text: "The key idea from every topic set. Select a title to read the full concept.",
  }));
  root.appendChild(controls);

  const body = el("div", { className: "cheatsheet-body" });
  for (const card of summaryCards) {
    const course = findCourse(card.courseId);
    if (!course) throw new Error(`Unknown course in summary: ${card.courseId}`);
    const article = el("article", {
      className: "cheatsheet-tip summary-card",
      attrs: { "aria-labelledby": `summary-${course.id}` },
    });
    const heading = el("h2", { attrs: { id: `summary-${course.id}` } });
    heading.appendChild(el("a", {
      text: course.title,
      attrs: { href: routeToPath({ name: "topic-list", courseId: course.id }) },
    }));
    article.appendChild(heading);
    const list = el("ul");
    for (const point of card.points) {
      const item = el("li");
      renderInlineText(item, point);
      list.appendChild(item);
    }
    article.appendChild(list);
    body.appendChild(article);
  }
  root.appendChild(body);
  keepSheetFitted(body, 26);
  return root;
}
