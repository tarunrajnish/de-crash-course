import { findCourse } from "../content";
import { el } from "../lib/dom";
import { navigate } from "../lib/router";
import { breadcrumb } from "../lib/breadcrumb";

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

  const list = el("div", { className: "topic-list" });

  course.topics.forEach((topic, i) => {
    const card = el("button", { className: "topic-card" });
    card.appendChild(el("span", { className: "topic-index", text: String(i + 1).padStart(2, "0") }));
    const body = el("div", { className: "topic-card-body" });
    body.appendChild(el("h3", { className: "topic-card-title", text: topic.title }));
    body.appendChild(el("p", { className: "topic-card-description", text: topic.shortDescription }));
    card.appendChild(body);
    card.addEventListener("click", () =>
      navigate({ name: "topic-detail", courseId: course.id, topicId: topic.id }),
    );
    list.appendChild(card);
  });

  root.appendChild(list);
  return root;
}
