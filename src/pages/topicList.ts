import { findCourse } from "../content";
import { el } from "../lib/dom";
import { icon, TOPIC_ICONS } from "../lib/icons";
import { routeToPath } from "../lib/router";
import { breadcrumb } from "../lib/breadcrumb";
import { courseProgress, isVisited, markCourseCompleted, resetTopicProgress } from "../lib/progress";
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
  const saveError = el("p", {
    className: "progress-save-error",
    text: "Your progress could not be saved. Allow site storage and try again.",
    attrs: { role: "alert" },
  });
  saveError.hidden = true;
  progressWrap.appendChild(saveError);
  root.appendChild(progressWrap);

  const list = el("div", { className: "topic-list" });
  const topicControls: { topicId: string; titleRow: HTMLElement; resetButton: HTMLButtonElement }[] = [];

  course.topics.forEach((topic, i) => {
    const card = el("article", { className: "topic-card" });
    const link = el("a", {
      className: "topic-card-link",
      attrs: { href: routeToPath({ name: "topic-detail", courseId: course.id, topicId: topic.id }) },
    });
    link.appendChild(el("span", { className: "topic-index", text: String(i + 1).padStart(2, "0") }));
    const body = el("div", { className: "topic-card-body" });
    const titleRow = el("h3", { className: "topic-card-title" });
    titleRow.appendChild(icon(TOPIC_ICONS[iconIndexFor(course.id + topic.id)], "topic-card-icon"));
    titleRow.appendChild(document.createTextNode(topic.title));
    if (isVisited(course.id, topic.id)) {
      titleRow.appendChild(readBadge());
    }
    body.appendChild(titleRow);
    body.appendChild(el("p", { className: "topic-card-description", text: topic.shortDescription }));
    link.appendChild(body);
    card.appendChild(link);
    const resetButton = el("button", {
      className: "progress-reset topic-card-reset",
      text: "Reset progress",
      attrs: { type: "button", "aria-label": `Reset progress for ${topic.title}` },
    });
    resetButton.hidden = import.meta.env.SSR || !isVisited(course.id, topic.id);
    resetButton.addEventListener("click", () => {
      if (!window.confirm(`Reset your reading progress for "${topic.title}" on this device? This can't be undone.`)) return;
      try {
        resetTopicProgress(course.id, topic.id);
      } catch (error) {
        console.error("Unable to reset topic progress.", error);
        saveError.hidden = false;
        return;
      }
      updateProgress();
    });
    topicControls.push({ topicId: topic.id, titleRow, resetButton });
    card.appendChild(resetButton);
    list.appendChild(card);
  });

  const updateProgress = (): void => {
    const current = courseProgress(course);
    saveError.hidden = true;
    progressBar.setAttribute("value", String(current.visited));
    progressLabel.textContent = `${current.visited} / ${total} read`;
    readingEstimate.textContent = readingTimeLabel(current.remainingMinutes, current.totalMinutes);
    const completed = current.visited === total;
    completeButton.textContent = completed ? "Completed" : "Mark as completed";
    completeButton.setAttribute("aria-label", completed ? `${course.title} completed` : `Mark ${course.title} as completed`);
    completeButton.disabled = completed;
    for (const { topicId, titleRow, resetButton } of topicControls) {
      const read = isVisited(course.id, topicId);
      resetButton.hidden = !read;
      const badge = titleRow.querySelector(".topic-card-visited");
      if (read && !badge) titleRow.appendChild(readBadge());
      else if (!read) badge?.remove();
    };
  }

  completeButton.addEventListener("click", () => {
    try {
      markCourseCompleted(course);
    } catch (error) {
      console.error("Unable to save concept completion.", error);
      saveError.hidden = false;
      return;
    }
    updateProgress();
  });

  root.appendChild(list);
  return root;
}
