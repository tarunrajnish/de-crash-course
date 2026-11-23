import { findCourse } from "../content";
import { el } from "../lib/dom";
import { icon, TOPIC_ICONS } from "../lib/icons";
import { routeToPath } from "../lib/router";
import { breadcrumb } from "../lib/breadcrumb";
import { courseProgress, isVisited, markCourseCompleted, resetCourseProgress } from "../lib/progress";
import { readingTimeLabel, READING_TIME_DESCRIPTION } from "../lib/readingTime";

function iconIndexFor(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % TOPIC_ICONS.length;
}

function readBadge(): HTMLSpanElement {
  return el("span", {
    className: "topic-card-visited",
    text: "Read",
    attrs: { title: "Marked as read" },
  });
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

  const progress = courseProgress(course);
  const { visited, total } = progress;
  const progressWrap = el("div", {
    className: "progress-meter",
  });
  const progressBar = el("progress", {
    className: "progress-meter-track",
    attrs: { value: String(visited), max: String(total || 1), "aria-label": `${course.title}: topics read` },
  });
  progressWrap.appendChild(progressBar);
  const progressLabel = el("span", {
    className: "progress-meter-label",
    text: `${visited} / ${total} read`,
    attrs: { role: "status" },
  });
  progressWrap.appendChild(progressLabel);
  const readingEstimate = el("span", {
    className: "reading-time-estimate",
    text: readingTimeLabel(progress.remainingMinutes, progress.totalMinutes),
    attrs: { title: READING_TIME_DESCRIPTION },
  });
  progressWrap.appendChild(readingEstimate);
  const completeButton = el("button", {
    className: "progress-complete",
    text: visited === total ? "Completed" : "Mark as completed",
    attrs: {
      type: "button",
      "aria-label": visited === total ? `${course.title} completed` : `Mark ${course.title} as completed`,
    },
  });
  completeButton.disabled = visited === total;
  completeButton.hidden = import.meta.env.SSR;
  progressWrap.appendChild(completeButton);
  const resetButton = el("button", {
    className: "progress-reset",
    text: "Reset progress",
    attrs: { type: "button", "aria-label": `Reset progress for ${course.title}` },
  });
  resetButton.hidden = import.meta.env.SSR || visited === 0;
  progressWrap.appendChild(resetButton);
  const saveError = el("p", {
    className: "progress-save-error",
    text: "Your progress could not be saved. Allow site storage and try again.",
    attrs: { role: "alert" },
  });
  saveError.hidden = true;
  progressWrap.appendChild(saveError);
  root.appendChild(progressWrap);

  const list = el("div", { className: "topic-list" });
  const topicTitles: HTMLElement[] = [];

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
      titleRow.appendChild(readBadge());
    }
    topicTitles.push(titleRow);
    body.appendChild(titleRow);
    body.appendChild(el("p", { className: "topic-card-description", text: topic.shortDescription }));
    card.appendChild(body);
    list.appendChild(card);
  });

  completeButton.addEventListener("click", () => {
    try {
      markCourseCompleted(course);
    } catch (error) {
      console.error("Unable to save concept completion.", error);
      saveError.hidden = false;
      return;
    }
    saveError.hidden = true;
    progressBar.setAttribute("value", String(total));
    progressLabel.textContent = `${total} / ${total} read`;
    readingEstimate.textContent = readingTimeLabel(0, progress.totalMinutes);
    completeButton.textContent = "Completed";
    completeButton.setAttribute("aria-label", `${course.title} completed`);
    completeButton.disabled = true;
    resetButton.hidden = false;
    for (const titleRow of topicTitles) {
      if (!titleRow.querySelector(".topic-card-visited")) titleRow.appendChild(readBadge());
    }
  });

  resetButton.addEventListener("click", () => {
    if (!window.confirm(`Reset your reading progress for "${course.title}" on this device? This can't be undone.`)) return;
    try {
      resetCourseProgress(course);
    } catch (error) {
      console.error("Unable to reset concept progress.", error);
      saveError.hidden = false;
      return;
    }
    window.location.reload();
  });

  root.appendChild(list);
  return root;
}
