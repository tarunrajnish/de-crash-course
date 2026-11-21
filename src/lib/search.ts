import { courses } from "../content";
import { cheatsheetGroups, cheatsheetSearchText } from "../content/cheatsheet";
import { el } from "./dom";
import { icon } from "./icons";
import { navigate } from "./router";
import type { Route } from "./router";

interface SearchEntry {
  route: Route;
  fragment?: string;
  title: string;
  category: string;
  haystack: string;
}

export function buildSearchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];
  for (const course of courses) {
    for (const topic of course.topics) {
      entries.push({
        route: { name: "topic-detail", courseId: course.id, topicId: topic.id },
        title: topic.title,
        category: course.title,
        haystack: `${course.title} ${topic.title} ${topic.shortDescription}`.toLowerCase(),
      });
    }
  }
  if (import.meta.env.LOCAL_CHEATSHEET) {
    for (const group of cheatsheetGroups) {
      for (const tip of group.tips) {
        entries.push({
          route: { name: "cheatsheet" },
          fragment: tip.id,
          title: tip.title,
          category: `Cheatsheet / ${group.title}`,
          haystack: cheatsheetSearchText(group, tip),
        });
      }
    }
  }
  return entries;
}

export function matchesSearchQuery(text: string, query: string): boolean {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = text.toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

export function initSearch(controls: HTMLElement): void {
  const index = buildSearchIndex();

  const overlay = el("div", { className: "search-overlay" });
  const modal = el("div", { className: "search-modal" });

  const inputRow = el("div", { className: "search-input-row" });
  inputRow.appendChild(icon("magnifier", "search-input-icon"));
  const searchLabel = import.meta.env.LOCAL_CHEATSHEET ? "Search topics and quick tips" : "Search topics";
  const input = el("input", {
    className: "search-input",
    attrs: { type: "text", placeholder: searchLabel, "aria-label": searchLabel },
  });
  inputRow.appendChild(input);
  modal.appendChild(inputRow);

  const resultsList = el("div", { className: "search-results" });
  modal.appendChild(resultsList);

  const emptyState = el("p", {
    className: "search-empty",
    text: import.meta.env.LOCAL_CHEATSHEET ? "No topics or quick tips match that search." : "No topics match that search.",
  });

  overlay.appendChild(modal);

  let activeIndex = 0;
  let currentResults: SearchEntry[] = [];

  function close(): void {
    overlay.classList.remove("search-overlay--open");
    input.value = "";
    document.body.classList.remove("search-open");
  }

  function open(): void {
    overlay.classList.add("search-overlay--open");
    document.body.classList.add("search-open");
    render("");
    requestAnimationFrame(() => input.focus());
  }

  function go(entry: SearchEntry): void {
    close();
    navigate(entry.route, entry.fragment);
  }

  function render(query: string): void {
    currentResults = index.filter((entry) => matchesSearchQuery(entry.haystack, query)).slice(0, 30);
    activeIndex = 0;

    while (resultsList.firstChild) resultsList.removeChild(resultsList.firstChild);

    if (currentResults.length === 0) {
      resultsList.appendChild(emptyState);
      return;
    }

    currentResults.forEach((entry, i) => {
      const item = el("button", {
        className: `search-result${i === activeIndex ? " search-result--active" : ""}`,
        attrs: { type: "button" },
      });
      item.appendChild(el("span", { className: "search-result-topic", text: entry.title }));
      item.appendChild(el("span", { className: "search-result-course", text: entry.category }));
      item.addEventListener("mouseenter", () => setActive(i));
      item.addEventListener("click", () => go(entry));
      resultsList.appendChild(item);
    });
  }

  function setActive(i: number): void {
    const items = resultsList.querySelectorAll(".search-result");
    items.forEach((node, idx) => node.classList.toggle("search-result--active", idx === i));
    activeIndex = i;
    items[i]?.scrollIntoView({ block: "nearest" });
  }

  input.addEventListener("input", () => render(input.value));

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (currentResults.length > 0) setActive((activeIndex + 1) % currentResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (currentResults.length > 0) setActive((activeIndex - 1 + currentResults.length) % currentResults.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const entry = currentResults[activeIndex];
      if (entry) go(entry);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  document.body.appendChild(overlay);

  document.addEventListener("keydown", (e) => {
    const isOpenShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
    if (isOpenShortcut) {
      e.preventDefault();
      if (overlay.classList.contains("search-overlay--open")) close();
      else open();
    } else if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && !overlay.classList.contains("search-overlay--open")) {
      e.preventDefault();
      open();
    }
  });

  const trigger = el("button", {
    className: "search-trigger",
    attrs: { type: "button", "aria-label": searchLabel },
  });
  trigger.appendChild(icon("magnifier", "search-trigger-icon"));
  trigger.appendChild(el("span", { className: "search-trigger-label", text: "Search" }));
  trigger.appendChild(el("span", { className: "search-trigger-shortcut", text: "\u2318K" }));
  trigger.addEventListener("click", open);
  controls.appendChild(trigger);
}
