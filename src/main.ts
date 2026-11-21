import "./fonts.css";
import "./style.css";
import { renderPage } from "./pages";
import { onRouteChange } from "./lib/router";
import { clear, el } from "./lib/dom";
import { initTheme, toggleTheme } from "./lib/theme";
import { initSearch } from "./lib/search";
import { applyPageMetadata } from "./lib/seo";
import { initGlossaryTooltips } from "./lib/glossaryTooltip";

initTheme();
const siteTools = el("div", {
  className: "site-tools",
  attrs: { role: "group", "aria-label": "Site controls" },
});
document.body.appendChild(siteTools);
initSearch(siteTools);
initGlossaryTooltips();

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
siteTools.appendChild(themeToggle);

onRouteChange((route) => {
  clear(app);
  window.scrollTo(0, 0);

  applyPageMetadata(route);
  app.appendChild(renderPage(route));
  document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
});

