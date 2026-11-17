import { findCourse } from "../content";
import { el } from "../lib/dom";
import { icon, TOPIC_ICONS } from "../lib/icons";
import { routeToPath } from "../lib/router";
import { breadcrumb } from "../lib/breadcrumb";
import { courseProgress, isVisited } from "../lib/progress";

function iconIndexFor(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % TOPIC_ICONS.length;
}

export function renderTopicList(courseId: string): HTMLElement {
  const course = findCourse(courseId);
  const root = el("div", { className: "page page-topic-list" });

  if (!course) {
    root.appendChild(el("p", { text: "Course not found." }));
    return root;
  }

  root.appendChild(breadcrumb([
    { label: "Home", route: { name: "home" } },
    { label: course.title, route: { name: "topic-list", courseId: course.id } },
  ]));

  root.appendChild(el("h1", { className: "page-title", text: course.title }));
  root.appendChild(el("p", { className: "page-subtitle", text: course.shortDescription }));

  const { visited, total } = courseProgress(course);
  const progressWrap = el("div", {
    className: "progress-meter",
  });
  const progressBar = el("div", { className: "progress-meter-track" });
  const pct = total > 0 ? Math.round((visited / total) * 100) : 0;
  progressBar.appendChild(el("div", { className: "progress-meter-fill", attrs: { style: `width: ${pct}%` } }));
  progressWrap.appendChild(progressBar);
  progressWrap.appendChild(el("span", { className: "progress-meter-label", text: `${visited} / ${total} read` }));
  root.appendChild(progressWrap);

  const list = el("div", { className: "topic-list" });

  course.topics.forEach((topic, i) => {
    const card = el("a", {
      className: "topic-card",
      attrs: { href: routeToPath({ name: "topic-detail", courseId: course.id, topicId: topic.id }) },
    });
    card.appendChild(el("span", { className: "topic-index", text: String(i + 1).padStart(2, "0") }));
    const body = el("div", { className: "topic-card-body" });
    const titleRow = el("h3", { className: "topic-card-title" });
    titleRow.appendChild(icon(TOPIC_ICONS[iconIndexFor(course.id + topic.id)], "topic-card-icon"));
    titleRow.appendChild(document.createTextNode(topic.title));
    if (isVisited(course.id, topic.id)) {
      titleRow.appendChild(el("span", { className: "topic-card-visited", text: "Read", attrs: { title: "You've opened this topic" } }));
    }
    body.appendChild(titleRow);
    body.appendChild(el("p", { className: "topic-card-description", text: topic.shortDescription }));
    card.appendChild(body);
    list.appendChild(card);
  });

  root.appendChild(list);
  return root;
}
