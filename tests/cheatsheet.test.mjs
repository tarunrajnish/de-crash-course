import { after, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";
import { parseHTML } from "linkedom";

const server = await createServer({
  mode: "production",
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
  logLevel: "error",
});
after(() => server.close());

const { cheatsheetGroups } = await server.ssrLoadModule("/src/content/cheatsheet.ts");
const { renderCheatsheet } = await server.ssrLoadModule("/src/pages/cheatsheet.ts");
const { buildSearchIndex, matchesSearchQuery, initSearch } = await server.ssrLoadModule("/src/lib/search.ts");
const { navigate, onRouteChange, routeToPath } = await server.ssrLoadModule("/src/lib/router.ts");

function installDOM() {
  const { window, document } = parseHTML("<html><body></body></html>");
  const globals = { window, document };
  const previous = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  return {
    window, document,
    restore() {
      for (const [key, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    },
  };
}

test("the static cheatsheet preserves grouped tips, complete code, and shareable anchors", async () => {
  const { document } = parseHTML(await readFile("dist/cheatsheet/index.html", "utf8"));
  const ids = [...document.querySelectorAll("[id]")].map(node => node.id);
  assert.equal(new Set(ids).size, ids.length, "IDs must be unique");
  assert.deepEqual([...document.querySelectorAll(".cheatsheet-group h2")].map(node => node.textContent),
    cheatsheetGroups.map(group => group.title));
  const plain = text => text.replace(/`([^`]+)`/g, "$1");
  for (const group of cheatsheetGroups) {
    for (const tip of group.tips) {
      const article = document.getElementById(tip.id);
      assert.ok(article && !article.hidden, tip.id);
      assert.equal(article.querySelector("h3 a").getAttribute("href"), `#${tip.id}`);
      assert.deepEqual([...article.querySelectorAll("p")].map(node => node.textContent), tip.paragraphs.map(plain));
      assert.equal(article.querySelector("pre code")?.textContent, tip.code);
      assert.equal(article.querySelector("button"), null, "No copy controls");
    }
  }
});

test("text and category filters combine, announce counts, hide empty groups, and reset", () => {
  const dom = installDOM();
  try {
    const page = renderCheatsheet();
    const input = page.querySelector('input[type="search"]');
    const select = page.querySelector("select");
    const visible = () => [...page.querySelectorAll(".cheatsheet-tip")].filter(tip => !tip.hidden);
    const search = text => {
      input.value = text;
      input.dispatchEvent(new dom.window.Event("input"));
    };
    const category = value => {
      for (const option of select.querySelectorAll("option")) option.selected = false;
      select.querySelector(`option[value="${value}"]`).selected = true;
      select.dispatchEvent(new dom.window.Event("change"));
    };
    search("  MySQL   median  ");
    assert.deepEqual(visible().map(tip => tip.id), ["sql-mysql-median"]);
    assert.equal(page.querySelectorAll(".cheatsheet-group:not([hidden])").length, 1);
    assert.match(page.querySelector('[role="status"]').textContent, /^1 of \d+ tips$/);
    category("python");
    assert.equal(visible().length, 0);
    assert.equal(page.querySelector(".cheatsheet-empty").hidden, false);
    search("ragged");
    assert.ok(visible().length > 0);
    assert.ok(visible().every(tip => tip.id.startsWith("python-")));
    category("");
    search("CROSS JOIN");
    assert.deepEqual(visible().map(tip => tip.id), ["sql-ctes"]);
    search("");
    assert.equal(visible().length, cheatsheetGroups.flatMap(group => group.tips).length);
    assert.equal(page.querySelector(".cheatsheet-empty").hidden, true);
  } finally { dom.restore(); }
});

test("an incoming tip anchor reveals a tip hidden by the current filters", () => {
  const dom = installDOM();
  const previousLocation = Object.getOwnPropertyDescriptor(dom.window, "location");
  try {
    Object.defineProperty(dom.window, "location", {
      configurable: true, value: { hash: "#python-list-instance" },
    });
    const page = renderCheatsheet();
    document.body.appendChild(page);
    const input = page.querySelector("input");
    input.value = "mysql median";
    input.dispatchEvent(new dom.window.Event("input"));
    const target = document.getElementById("python-list-instance");
    assert.equal(target.hidden, true);
    let scrolled = false;
    target.scrollIntoView = () => { scrolled = true; };
    dom.window.dispatchEvent(new dom.window.Event("hashchange"));
    assert.equal(input.value, "");
    assert.equal(target.hidden, false);
    assert.equal(target.parentElement.hidden, false);
    assert.equal(scrolled, true);
  } finally {
    if (previousLocation) Object.defineProperty(dom.window, "location", previousLocation);
    else delete dom.window.location;
    dom.restore();
  }
});

test("global search finds tip explanations and code and navigates to the matching anchor", () => {
  const index = buildSearchIndex();
  assert.ok(index.some(entry => entry.route.name === "topic-detail"), "Keep lesson results");
  const destinations = index.map(entry => `${routeToPath(entry.route)}#${entry.fragment ?? ""}`);
  assert.equal(new Set(destinations).size, destinations.length, "Each destination appears once");
  for (const [query, id] of [
    ["mysql median row_number", "sql-mysql-median"],
    ["python descriptor", "python-list-instance"],
    ["debEzium kafka", "de-cdc-use-cases"],
    ["size economics", "de-nonfunctional-scale"],
    ["vacuum dry run", "de-delta-vacuum"],
    ["version as of", "de-delta-time-travel-restore"],
    ["liquid clustering keys", "de-databricks-liquid-clustering"],
    ["cdf downstream", "de-delta-change-data-feed"],
  ]) {
    const results = index.filter(entry => matchesSearchQuery(entry.haystack, query));
    assert.ok(results.some(entry => entry.route.name === "cheatsheet" && entry.fragment === id), query);
  }
  const dom = installDOM();
  const previousLocation = Object.getOwnPropertyDescriptor(dom.window, "location");
  try {
    let destination;
    Object.defineProperty(dom.window, "location", {
      configurable: true,
      value: { assign: href => { destination = href; } },
    });
    initSearch();
    const input = document.querySelector(".search-input");
    input.value = "mysql median";
    input.dispatchEvent(new dom.window.Event("input"));
    const result = document.querySelector(".search-result");
    assert.match(result.textContent, /median/);
    assert.match(result.textContent, /Cheatsheet \/ SQL/);
    result.click();
    assert.equal(destination, `${routeToPath({ name: "cheatsheet" })}#sql-mysql-median`);
    navigate({ name: "home" });
    assert.equal(destination, routeToPath({ name: "home" }));
  } finally {
    if (previousLocation) Object.defineProperty(dom.window, "location", previousLocation);
    else delete dom.window.location;
    dom.restore();
  }
});

test("tip fragment changes preserve the rendered page while legacy hash routes still redirect", () => {
  const dom = installDOM();
  const previousLocation = Object.getOwnPropertyDescriptor(dom.window, "location");
  let dispose;
  try {
    let destination;
    const location = {
      hash: "",
      pathname: routeToPath({ name: "cheatsheet" }),
      replace: href => { destination = href; },
    };
    Object.defineProperty(dom.window, "location", { configurable: true, value: location });
    let renders = 0;
    dispose = onRouteChange(() => { renders++; });
    assert.equal(renders, 1);
    location.hash = "#sql-mysql-median";
    dom.window.dispatchEvent(new dom.window.Event("hashchange"));
    assert.equal(renders, 1, "Anchor navigation must preserve filters and scroll");
    location.hash = "#/course/spark-delta-basics/topic/what-is-spark";
    dom.window.dispatchEvent(new dom.window.Event("hashchange"));
    assert.equal(destination, routeToPath({
      name: "topic-detail", courseId: "spark-delta-basics", topicId: "what-is-spark",
    }));
  } finally {
    dispose?.();
    if (previousLocation) Object.defineProperty(dom.window, "location", previousLocation);
    else delete dom.window.location;
    dom.restore();
  }
});
