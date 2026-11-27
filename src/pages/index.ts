import type { Route } from "../lib/router";
import { routeToPath } from "../lib/router";
import { pageMetadata } from "../lib/seo";
import { el } from "../lib/dom";
import { renderHome } from "./home";
import { renderTopicList } from "./topicList";
import { renderTopicDetail } from "./topicDetail";
import { renderCheatsheet } from "./cheatsheet";
import { renderSummary } from "./summary";
import { renderAbout } from "./about";

export function renderPage(route: Route): HTMLElement {
  if (pageMetadata(route).found) {
    switch (route.name) {
      case "home": return renderHome();
      case "about": return renderAbout();
      case "cheatsheet":
        if (import.meta.env.LOCAL_CHEATSHEET) return renderCheatsheet();
        break;
      case "summary": return renderSummary();
      case "topic-list": return renderTopicList(route.courseId);
      case "topic-detail": return renderTopicDetail(route.courseId, route.topicId);
    }
  }
  return el("div", { className: "page" }, [
    el("h1", { className: "page-title", text: "Page not found" }),
    el("p", { text: "This page may have moved. Browse the course topics from the homepage." }),
    el("a", { text: "Back to home", attrs: { href: routeToPath({ name: "home" }) } }),
  ]);
}
