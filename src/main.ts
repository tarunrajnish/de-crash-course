import "./style.css";
import { renderHome } from "./pages/home";
import { renderTopicList } from "./pages/topicList";
import { renderTopicDetail } from "./pages/topicDetail";
import { onRouteChange } from "./lib/router";
import { clear, el } from "./lib/dom";
import { initTheme, toggleTheme } from "./lib/theme";

initTheme();

const app = document.querySelector<HTMLDivElement>("#app")!;

const themeToggle = el("button", {
  className: "theme-toggle",
  attrs: { type: "button", "aria-label": "Toggle light and dark theme" },
});

function syncToggleLabel() {
  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  themeToggle.textContent = isLight ? "Dark mode" : "Light mode";
}

syncToggleLabel();
themeToggle.addEventListener("click", () => {
  toggleTheme();
  syncToggleLabel();
});
document.body.appendChild(themeToggle);

onRouteChange((route) => {
  clear(app);
  window.scrollTo(0, 0);

  switch (route.name) {
    case "home":
      app.appendChild(renderHome());
      break;
    case "topic-list":
      app.appendChild(renderTopicList(route.courseId));
      break;
    case "topic-detail":
      app.appendChild(renderTopicDetail(route.courseId, route.topicId));
      break;
  }
});

