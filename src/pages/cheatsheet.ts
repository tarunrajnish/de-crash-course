import { cheatsheetGroups, cheatsheetSearchText } from "../content/cheatsheet";
import { breadcrumb } from "../lib/breadcrumb";
import { el } from "../lib/dom";
import { renderInlineText } from "../lib/inlineCode";
import { matchesSearchQuery } from "../lib/search";

export function renderCheatsheet(): HTMLElement {
  const root = el("div", { className: "page page-cheatsheet" });
  root.appendChild(breadcrumb([
    { label: "Home", route: { name: "home" } },
    { label: "Cheatsheet", route: { name: "cheatsheet" } },
  ]));
  root.appendChild(el("h1", { className: "page-title", text: "Quick-reference cheatsheet" }));
  root.appendChild(el("p", {
    className: "page-subtitle",
    text: "Compact syntax and concepts for SQL, Python, and data engineering. Identifiers are illustrative; maintenance commands are reference-only.",
  }));

  const controls = el("div", { className: "cheatsheet-controls" });
  const searchLabel = el("label", { className: "cheatsheet-field", text: "Search quick tips" });
  const input = el("input", {
    attrs: { type: "search", placeholder: "Try median, matrix, or CDC" },
  });
  searchLabel.appendChild(input);
  controls.appendChild(searchLabel);
  const categoryLabel = el("label", { className: "cheatsheet-field", text: "Category" });
  const category = el("select");
  const allCategories = el("option", { text: "All categories", attrs: { value: "" } });
  category.appendChild(allCategories);
  for (const group of cheatsheetGroups) {
    category.appendChild(el("option", { text: group.title, attrs: { value: group.id } }));
  }
  categoryLabel.appendChild(category);
  controls.appendChild(categoryLabel);
  const fitToggle = el("button", {
    className: "cheatsheet-fit-toggle",
    text: "Fit to screen",
    attrs: { type: "button", "aria-pressed": "false" },
  });
  controls.appendChild(fitToggle);
  root.appendChild(controls);

  const total = cheatsheetGroups.reduce((count, group) => count + group.tips.length, 0);
  const status = el("p", {
    className: "cheatsheet-status",
    text: `${total} tips`,
    attrs: { role: "status", "aria-live": "polite", "aria-atomic": "true" },
  });
  root.appendChild(status);
  const body = el("div", { className: "cheatsheet-body" });
  root.appendChild(body);
  const groups = cheatsheetGroups.map(group => {
    const section = el("section", {
      className: "cheatsheet-group",
      attrs: { "aria-labelledby": `cheatsheet-${group.id}` },
    });
    section.appendChild(el("h2", {
      className: "section-heading",
      text: group.title,
      attrs: { id: `cheatsheet-${group.id}` },
    }));
    const tips = group.tips.map(tip => {
      const article = el("article", {
        className: "cheatsheet-tip",
        attrs: { id: tip.id, "aria-labelledby": `${tip.id}-heading` },
      });
      const heading = el("h3", { attrs: { id: `${tip.id}-heading` } });
      heading.appendChild(el("a", { text: tip.title, attrs: { href: `#${tip.id}` } }));
      article.appendChild(heading);
      for (const text of tip.paragraphs) {
        const paragraph = el("p");
        renderInlineText(paragraph, text);
        article.appendChild(paragraph);
      }
      if (tip.code) {
        article.appendChild(el("pre", {
          className: "cheatsheet-code",
          attrs: { tabindex: "0", "aria-label": `${tip.title}: example` },
        }, [el("code", { text: tip.code })]));
      }
      section.appendChild(article);
      return { article, haystack: cheatsheetSearchText(group, tip) };
    });
    body.appendChild(section);
    return { section, id: group.id, tips };
  });
  const empty = el("p", {
    className: "cheatsheet-empty",
    text: "No tips match. Try another search or category.",
    attrs: { hidden: "" },
  });
  body.appendChild(empty);

  function filter(): void {
    let visible = 0;
    for (const group of groups) {
      let groupVisible = 0;
      for (const tip of group.tips) {
        const match = (!category.value || category.value === group.id)
          && matchesSearchQuery(tip.haystack, input.value);
        tip.article.hidden = !match;
        if (match) groupVisible++;
      }
      group.section.hidden = groupVisible === 0;
      visible += groupVisible;
    }
    status.textContent = `${visible} of ${total} tips`;
    empty.hidden = visible > 0;
    fitSheet();
  }

  const MAX_SHEET_FONT = 16;
  const MIN_SHEET_FONT = 5.5;
  // Picks the largest font size at which every column fits on one screen.
  function fitSheet(): void {
    if (!root.classList.contains("cheatsheet-sheet") || !body.clientWidth) return;
    body.style.overflowX = "hidden";
    let size = MAX_SHEET_FONT;
    for (; size > MIN_SHEET_FONT; size -= 0.25) {
      body.style.fontSize = `${size}px`;
      if (body.scrollWidth <= body.clientWidth + 1) break;
    }
    body.style.fontSize = `${size}px`;
    if (body.scrollWidth > body.clientWidth + 1) body.style.overflowX = "auto";
  }

  function setSheet(on: boolean): void {
    root.classList.toggle("cheatsheet-sheet", on);
    fitToggle.textContent = on ? "Exit fit view" : "Fit to screen";
    fitToggle.setAttribute("aria-pressed", String(on));
    if (on) fitSheet();
    else {
      body.style.fontSize = "";
      body.style.overflowX = "";
    }
  }
  fitToggle.addEventListener("click", () => setSheet(!root.classList.contains("cheatsheet-sheet")));
  input.addEventListener("input", filter);
  category.addEventListener("change", filter);
  const view = document.defaultView;
  if (view) {
    view.addEventListener("resize", fitSheet);
    view.addEventListener("keydown", event => {
      if (event.key === "Escape" && root.classList.contains("cheatsheet-sheet")) setSheet(false);
    });
    view.addEventListener("hashchange", () => {
      const target = root.ownerDocument.getElementById(view.location.hash.slice(1));
      if (target?.classList.contains("cheatsheet-tip") && target.hidden) {
        input.value = "";
        allCategories.selected = true;
        filter();
        target.scrollIntoView();
      }
    });
  }
  return root;
}
