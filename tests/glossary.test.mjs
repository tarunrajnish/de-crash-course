import { after, test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { parseHTML } from "linkedom";

const server = await createServer({
  mode: "production",
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
  logLevel: "error",
});
after(() => server.close());

const { courses } = await server.ssrLoadModule("/src/content/index.ts");
const { glossary } = await server.ssrLoadModule("/src/content/glossary.ts");
const { createGlossaryMatcher, createGlossaryRenderer } = await server.ssrLoadModule("/src/lib/glossary.ts");
const { renderInlineText } = await server.ssrLoadModule("/src/lib/inlineCode.ts");
const { renderTopicDetail } = await server.ssrLoadModule("/src/pages/topicDetail.ts");
const { initGlossaryTooltips } = await server.ssrLoadModule("/src/lib/glossaryTooltip.ts");

function installDOM() {
  const { window, document } = parseHTML("<html><body></body></html>");
  const globals = { window, document, Element: window.Element, Node: window.Node };
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

test("matching prioritizes phrases, respects word boundaries, and preserves original text", () => {
  const match = createGlossaryMatcher(["Spark", "SQL", "DataFrame", "Semantic layer", "dbt Semantic Layer"]);
  const text = "SPARK, Sparkles, SQLé, naïveSQL, SQL-based, DataFrames; dbt Semantic Layer.";
  assert.deepEqual(match(text).map(({ text, term }) => [text, term]), [
    ["SPARK", "Spark"], ["SQL", "SQL"], ["DataFrames", "DataFrame"], ["dbt Semantic Layer", "dbt Semantic Layer"],
  ]);
  assert.deepEqual(match(text).map(hit => text.slice(hit.start, hit.end)), match(text).map(hit => hit.text));
  assert.equal(createGlossaryMatcher([])("Spark").length, 0);
  assert.equal(createGlossaryMatcher(["PARTITION BY", "Partition"])("PARTITION BY key")[0].term, "PARTITION BY");
});

test("literal punctuation, context-sensitive names, and whole-code matching avoid false explanations", () => {
  const match = createGlossaryMatcher(["Recall@k", "collect()", "Unstructured", "REST", "ReAct", "MERGE", "SQL"]);
  assert.deepEqual(match("recall@5 collect() rest REST react ReAct unstructured Unstructured merge MERGE")
    .map(hit => hit.text), ["recall@5", "collect()", "REST", "ReAct", "Unstructured", "MERGE"]);
  assert.equal(match("spark.sql.shuffle.partitions", true).length, 0);
  assert.equal(match("SQL", true)[0].term, "SQL");
  assert.equal(match("SQL query", true).length, 0);
});

test("all lessons render their curated concepts without changing prose or nesting controls", () => {
  const dom = installDOM();
  try {
    for (const course of courses) {
      for (const topic of course.topics) {
        assert.ok(topic.glossary.length > 0 && topic.glossary.length <= 10, `${topic.id}: select at most 10 core concepts`);
        assert.equal(new Set(topic.glossary).size, topic.glossary.length, `${topic.id}: duplicate selections`);
        for (const term of topic.glossary) assert.ok(glossary[term]?.definition, `${topic.id}: invalid ${term}`);
        const page = renderTopicDetail(course.id, topic.id);
        const triggers = [...page.querySelectorAll(".glossary-term")];
        const used = new Set(triggers.map(node => node.dataset.glossaryTerm));
        assert.deepEqual(used, new Set(topic.glossary), `${topic.id}: selected concepts must appear in rendered content`);
        assert.equal(triggers.length, used.size, `${topic.id}: define each concept only once`);
        assert.ok(triggers.length <= 10, `${topic.id}: at most 10 definitions on the page`);
        assert.equal(page.querySelectorAll("h1 .glossary-term, h2 .glossary-term, th .glossary-term, .page-subtitle .glossary-term").length, 0);
        assert.equal(page.querySelector("h1").textContent, topic.title);
        const paragraphs = [...page.querySelectorAll(".section-paragraph")];
        const original = topic.sections.flatMap(section => section.paragraphs);
        assert.deepEqual(paragraphs.map(p => p.textContent), original.map(text => text.replace(/`([^`]+)`/g, "$1")));
        assert.equal(page.querySelectorAll("button button, a .glossary-term, .glossary-term .glossary-term").length, 0);
        assert.equal(page.querySelectorAll(".inline-code button:not(.glossary-term)").length, 0);
        for (const trigger of page.querySelectorAll(".glossary-term")) {
          assert.equal(trigger.getAttribute("type"), "button");
          assert.ok(trigger.textContent.length);
          assert.equal(trigger.getAttribute("title"), null);
        }
        const tableTexts = topic.sections.flatMap(section => section.table?.rows.flat() ?? []);
        assert.deepEqual([...page.querySelectorAll(".content-wrap td")].map(cell => cell.textContent),
          tableTexts.map(text => text.replace(/`([^`]+)`/g, "$1")));
      }
    }
  } finally { dom.restore(); }
});

test("a concept is defined once across paragraphs, aliases, and code, with fresh state for each topic", () => {
  const dom = installDOM();
  try {
    const renderDefinitions = createGlossaryRenderer(["Spark", "DataFrame"]);
    const first = document.createElement("p");
    const second = document.createElement("p");
    renderInlineText(first, "Spark uses DataFrames. SPARK and DataFrame repeat.", renderDefinitions);
    renderInlineText(second, "Spark also appears as `Spark` beside more DataFrames.", renderDefinitions);
    assert.deepEqual([...first.querySelectorAll(".glossary-term")].map(node => node.textContent), ["Spark", "DataFrames"]);
    assert.equal(first.textContent, "Spark uses DataFrames. SPARK and DataFrame repeat.");
    assert.equal(second.querySelector(".glossary-term"), null);
    assert.equal(second.textContent, "Spark also appears as Spark beside more DataFrames.");
    assert.equal(second.querySelector("code").textContent, "Spark");
    assert.equal(second.querySelector("button"), null);
    const nextTopic = document.createElement("p");
    createGlossaryRenderer(["Spark"])(nextTopic, "Spark");
    assert.equal(nextTopic.querySelectorAll(".glossary-term").length, 1);
    assert.doesNotThrow(() => createGlossaryRenderer(Object.keys(glossary).slice(0, 10)));
    assert.throws(() => createGlossaryRenderer(Object.keys(glossary).slice(0, 11)), /at most 10/);
  } finally { dom.restore(); }
});

test("definitions render as safe text and code retains its formatting without copy controls", () => {
  const dom = installDOM();
  try {
    const target = document.createElement("p");
    renderInlineText(target, '<script>danger()</script> SQL `ef_search` `spark.sql.shuffle.partitions`',
      createGlossaryRenderer(["SQL", "ef_search"]));
    assert.equal(target.querySelector("script"), null);
    assert.ok(target.textContent.startsWith("<script>danger()</script>"));
    assert.equal(target.querySelectorAll(".glossary-term").length, 2);
    assert.equal(target.querySelector("code .glossary-term").textContent, "ef_search");
    assert.equal(target.querySelectorAll("code")[1].querySelector(".glossary-term"), null);
    assert.deepEqual([...target.querySelectorAll("code")].map(code => code.textContent),
      ["ef_search", "spark.sql.shuffle.partitions"]);
    assert.equal(target.querySelectorAll("button:not(.glossary-term)").length, 0);
    assert.equal(target.querySelectorAll("button button").length, 0);
    const plain = document.createElement("p");
    renderInlineText(plain, "Rank with `ROW_NUMBER()` and query with `SQL`.");
    assert.equal(plain.querySelector(".glossary-term"), null);
    assert.deepEqual([...plain.querySelectorAll(".inline-code code")].map(code => code.textContent),
      ["ROW_NUMBER()", "SQL"]);
    assert.equal(plain.querySelector("button"), null);
    assert.equal(plain.textContent, "Rank with ROW_NUMBER() and query with SQL.");
  } finally {
    dom.restore();
  }
});

test("hover, focus, tap, dismissal, and narrow-screen placement share one tooltip", async () => {
  const dom = installDOM();
  let dispose;
  try {
    const target = document.createElement("p");
    createGlossaryRenderer(["Spark", "SQL"])(target, "Spark and SQL");
    document.body.appendChild(target);
    const [spark, sql] = target.querySelectorAll("button");
    const anchor = { left: 310, right: 320, top: 460, bottom: 480, width: 10, height: 20 };
    spark.getBoundingClientRect = sql.getBoundingClientRect = () => anchor;
    Object.defineProperties(document.documentElement, {
      clientWidth: { configurable: true, value: 320 },
      clientHeight: { configurable: true, value: 500 },
    });
    const fire = (element, type, properties = {}) => {
      const event = new dom.window.Event(type, { bubbles: true, cancelable: true });
      Object.assign(event, properties);
      element.dispatchEvent(event);
      return event;
    };
    dispose = initGlossaryTooltips();
    const tooltip = document.querySelector('[role="tooltip"]');
    tooltip.getBoundingClientRect = () => ({ width: 296, height: 120 });
    spark.setAttribute("aria-describedby", "existing-help");
    assert.equal(tooltip.hidden, true);
    fire(spark, "pointerover", { pointerType: "mouse" });
    assert.equal(tooltip.hidden, false);
    assert.equal(tooltip.querySelector("p").textContent, glossary.Spark.definition);
    assert.equal(spark.getAttribute("aria-describedby"), "existing-help glossary-tooltip");
    assert.equal(tooltip.style.left, "12px");
    assert.equal(tooltip.style.top, "332px");
    fire(spark, "pointerout", { relatedTarget: tooltip });
    fire(tooltip, "pointerover", { pointerType: "mouse" });
    await new Promise(resolve => setTimeout(resolve, 210));
    assert.equal(tooltip.hidden, false, "explanation remains hoverable");
    fire(document, "keydown", { key: "Escape" });
    assert.equal(tooltip.hidden, true);
    assert.equal(spark.getAttribute("aria-describedby"), "existing-help");
    fire(sql, "focusin");
    assert.equal(tooltip.querySelector("strong").textContent, "SQL");
    fire(sql, "focusout", { relatedTarget: document.body });
    assert.equal(tooltip.hidden, true);
    fire(spark, "pointerover", { pointerType: "touch" });
    assert.equal(tooltip.hidden, true, "touch hover does not preempt the tap toggle");
    fire(spark, "click");
    assert.equal(tooltip.hidden, false);
    fire(spark, "click");
    assert.equal(tooltip.hidden, true);
    fire(sql, "click");
    fire(document.body, "pointerdown");
    assert.equal(tooltip.hidden, true);
    fire(spark, "focusin");
    dom.window.dispatchEvent(new dom.window.Event("resize"));
    assert.equal(tooltip.hidden, true);
    fire(sql, "focusin");
    dom.window.dispatchEvent(new dom.window.Event("scroll"));
    assert.equal(tooltip.hidden, true);
    fire(spark, "pointerover", { pointerType: "mouse" });
    fire(spark, "pointerout", { relatedTarget: document.body });
    await new Promise(resolve => setTimeout(resolve, 210));
    assert.equal(tooltip.hidden, true);
    assert.equal(document.querySelectorAll('[role="tooltip"]').length, 1);
  } finally {
    dispose?.();
    dom.restore();
  }
});
