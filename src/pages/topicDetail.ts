import { findTopic } from "../content";
import type { ComparisonTable, ContentSection, SelfTestQuestion } from "../content/types";
import { el } from "../lib/dom";
import { breadcrumb } from "../lib/breadcrumb";
import { markVisited } from "../lib/progress";
import { renderInlineText } from "../lib/inlineCode";

const SHOW_ANIMATIONS = false;

function renderTable(table: ComparisonTable): HTMLElement {
  const wrap = el("div", { className: "table-wrap" });
  if (table.caption) wrap.appendChild(el("p", { className: "table-caption", text: table.caption }));
  const tableEl = el("table", { className: "comparison-table" });
  const thead = el("thead");
  const headRow = el("tr");
  for (const h of table.headers) headRow.appendChild(el("th", { text: h }));
  thead.appendChild(headRow);
  tableEl.appendChild(thead);
  const tbody = el("tbody");
  for (const row of table.rows) {
    const tr = el("tr");
    for (const cell of row) tr.appendChild(el("td", { text: cell }));
    tbody.appendChild(tr);
  }
  tableEl.appendChild(tbody);
  wrap.appendChild(tableEl);
  return wrap;
}

function renderSection(section: ContentSection): HTMLElement {
  const wrap = el("section", { className: "content-section" });
  wrap.appendChild(el("h2", { className: "section-heading", text: section.heading }));
  for (const p of section.paragraphs) {
    const para = el("p", { className: "section-paragraph" });
    renderInlineText(para, p);
    wrap.appendChild(para);
  }
  if (section.table) wrap.appendChild(renderTable(section.table));
  if (section.warning) {
    const warn = el("div", { className: "callout callout-warning" });
    warn.appendChild(el("span", { className: "callout-label", text: "Cost / gotcha" }));
    const warnText = el("p");
    renderInlineText(warnText, section.warning);
    warn.appendChild(warnText);
    wrap.appendChild(warn);
  }
  return wrap;
}

function renderSelfTestItem(q: SelfTestQuestion, index: number): HTMLElement {
  const item = el("div", { className: "self-test-item" });
  const question = el("p", { className: "self-test-question" });
  renderInlineText(question, `${index + 1}. ${q.question}`);
  item.appendChild(question);
  if (q.answer) {
    const details = el("details", { className: "self-test-answer" });
    const summary = el("summary", { text: "Reveal answer" });
    details.appendChild(summary);
    const answer = el("p");
    renderInlineText(answer, q.answer);
    details.appendChild(answer);
    item.appendChild(details);
  }
  return item;
}

export function renderTopicDetail(courseId: string, topicId: string): HTMLElement {
  const found = findTopic(courseId, topicId);
  const root = el("div", { className: "page page-topic-detail" });

  if (!found) {
    root.appendChild(el("p", { text: "Topic not found." }));
    return root;
  }

  const { course, topic } = found;
  markVisited(course.id, topic.id);

  root.appendChild(breadcrumb([
    { label: "Home", route: { name: "home" } },
    { label: course.title, route: { name: "topic-list", courseId: course.id } },
    { label: topic.title, route: { name: "topic-detail", courseId: course.id, topicId: topic.id } },
  ]));

  root.appendChild(el("h1", { className: "page-title", text: topic.title }));
  root.appendChild(el("p", { className: "page-subtitle", text: topic.shortDescription }));

  if (SHOW_ANIMATIONS && topic.animation) {
    const figure = el("figure", { className: "animation-figure" });
    const img = el("img", {
      className: "animation-svg",
      attrs: { src: `${import.meta.env.BASE_URL}${topic.animation.replace(/^\/+/, "")}`, alt: `${topic.title} animation` },
    });
    figure.appendChild(img);
    if (topic.animationCaption) {
      figure.appendChild(el("figcaption", { className: "animation-caption", text: topic.animationCaption }));
    }
    root.appendChild(figure);
  }

  const contentWrap = el("div", { className: "content-wrap" });
  for (const section of topic.sections) contentWrap.appendChild(renderSection(section));
  root.appendChild(contentWrap);

  if (topic.videos && topic.videos.length > 0) {
    const videoSection = el("section", { className: "content-section videos-section" });
    videoSection.appendChild(el("h2", { className: "section-heading", text: "Video" }));
    const list = el("ul", { className: "video-list" });
    for (const v of topic.videos) {
      const li = el("li");
      const link = el("a", { text: v.title, attrs: { href: v.url, target: "_blank", rel: "noopener noreferrer" } });
      li.appendChild(link);
      list.appendChild(li);
    }
    videoSection.appendChild(list);
    root.appendChild(videoSection);
  }

  if (topic.examplesToAttach && topic.examplesToAttach.length > 0) {
    const examplesBox = el("div", { className: "callout callout-examples" });
    examplesBox.appendChild(el("span", { className: "callout-label", text: "Your examples to attach" }));
    const list = el("ul", { className: "examples-list" });
    for (const e of topic.examplesToAttach) {
      const li = el("li");
      renderInlineText(li, e);
      list.appendChild(li);
    }
    examplesBox.appendChild(list);
    root.appendChild(examplesBox);
  }

  if (topic.selfTest.length > 0) {
    const testSection = el("section", { className: "content-section self-test-section" });
    testSection.appendChild(el("h2", { className: "section-heading", text: "Practice / self-test" }));
    const list = el("div", { className: "self-test-list" });
    topic.selfTest.forEach((q, i) => list.appendChild(renderSelfTestItem(q, i)));
    testSection.appendChild(list);
    root.appendChild(testSection);
  }

  return root;
}
