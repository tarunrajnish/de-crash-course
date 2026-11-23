import { after, test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { parseHTML } from "linkedom";

const server = await createServer({
  mode: "production",
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
  logLevel: "error",
  plugins: [{
    name: "test-browser-progress",
    enforce: "pre",
    transform(code, id) {
      if (id.endsWith("/src/lib/progress.ts") || id.endsWith("/src/pages/topicList.ts")) {
        return code.replaceAll("import.meta.env.SSR", "false");
      }
    },
  }],
});
after(() => server.close());

const { courses } = await server.ssrLoadModule("/src/content/index.ts");
const { courseProgress, overallProgress, isVisited, markVisited, markCourseCompleted, resetProgress, resetCourseProgress } =
  await server.ssrLoadModule("/src/lib/progress.ts");
const { estimatedReadingMinutes, readingTimeLabel } = await server.ssrLoadModule("/src/lib/readingTime.ts");
const { renderHome } = await server.ssrLoadModule("/src/pages/home.ts");
const { renderTopicList } = await server.ssrLoadModule("/src/pages/topicList.ts");

function emptyTopic(id = "timed") {
  return { id, title: "", shortDescription: "", glossary: [], sections: [], selfTest: [] };
}

function words(count) {
  return Array(count).fill("word").join(" ");
}

test("merged lessons retain old read markers without double-counting or losing other progress", () => {
  const storageKey = "de-crash-course-progress";
  const original = [
    "pushdown-and-caching/predicate-partition-pruning",
    "pushdown-and-caching/caching-vs-checkpointing",
    "transformations-joins-skew/predicate-partition-pruning",
    "spark-delta-basics/what-is-spark",
  ];
  const stored = JSON.stringify(original);
  const values = new Map([[storageKey, stored]]);
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value); },
      removeItem: key => { values.delete(key); },
    },
  });
  try {
    const merged = courses.find(course => course.id === "transformations-joins-skew");
    const totalMinutes = merged.topics.reduce((sum, topic) => sum + estimatedReadingMinutes(topic), 0);
    const readMinutes = merged.topics.filter(topic =>
      ["predicate-partition-pruning", "caching-vs-checkpointing"].includes(topic.id))
      .reduce((sum, topic) => sum + estimatedReadingMinutes(topic), 0);
    const initial = { visited: 2, total: 6, totalMinutes, remainingMinutes: totalMinutes - readMinutes };
    assert.deepEqual(courseProgress(merged), initial);
    assert.equal(overallProgress(courses).visited, 3);
    for (const courseId of ["pushdown-and-caching", merged.id]) {
      assert.equal(isVisited(courseId, "predicate-partition-pruning"), true);
      assert.equal(isVisited(courseId, "caching-vs-checkpointing"), true);
    }
    assert.equal(values.get(storageKey), stored, "Reading progress should not rewrite browser data");

    markVisited("pushdown-and-caching", "caching-vs-checkpointing");
    const updated = JSON.parse(values.get(storageKey));
    for (const entry of original) assert.ok(updated.includes(entry));
    assert.ok(updated.includes("transformations-joins-skew/caching-vs-checkpointing"));
    assert.deepEqual(courseProgress(merged), initial);
    assert.equal(overallProgress(courses).visited, 3);

    markVisited(merged.id, "skew-and-salting");
    assert.deepEqual(courseProgress(merged), {
      ...initial,
      visited: 3,
      remainingMinutes: initial.remainingMinutes - estimatedReadingMinutes(merged.topics.find(topic => topic.id === "skew-and-salting")),
    });
    assert.equal(overallProgress(courses).visited, 4);
    resetProgress();
    assert.deepEqual(courseProgress(merged), { visited: 0, total: 6, totalMinutes, remainingMinutes: totalMinutes });
    assert.equal(overallProgress(courses).visited, 0);
    assert.equal(isVisited("pushdown-and-caching", "caching-vs-checkpointing"), false);
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete globalThis.localStorage;
  }
});

test("reading estimates round at 200-word boundaries and count all written learning content", () => {
  for (const [count, minutes] of [[0, 0], [200, 1], [201, 2], [400, 2], [401, 3]]) {
    const topic = { ...emptyTopic(), sections: [{ heading: "", paragraphs: [words(count)] }] };
    assert.equal(estimatedReadingMinutes(topic), minutes, `${count} words`);
  }
  const table = { caption: "word", headers: ["word"], rows: [["word"]] };
  for (const visual of [{ steps: [{ label: "word", detail: "word" }] }, { table }]) {
    const topic = {
      ...emptyTopic(),
      title: "word",
      shortDescription: "word",
      sections: [{ heading: "word", paragraphs: [words(visual.table ? 186 : 187)], warning: "word", table }],
      example: { title: "word", description: "word", takeaway: "word", ...visual },
      selfTest: [{ question: "word", answer: "word" }],
      videos: [{ title: words(1000), url: "https://example.com/video" }],
    };
    assert.equal(estimatedReadingMinutes(topic), 2, "201 written words, excluding video content");
    topic.selfTest[0].answer = "";
    assert.equal(estimatedReadingMinutes(topic), 1, "200 written words after removing one answer word");
  }
  const illustrated = {
    ...emptyTopic(),
    sections: [{
      heading: "", paragraphs: [words(200)],
      diagram: { src: "assets/example.svg", alt: words(1000), caption: "word" },
    }],
  };
  assert.equal(estimatedReadingMinutes(illustrated), 2, "Visible captions count toward reading time");
  delete illustrated.sections[0].diagram.caption;
  assert.equal(estimatedReadingMinutes(illustrated), 1, "Alternative image text is not counted again");
});

test("remaining time subtracts each opened topic once, preserves totals, and resets globally and per concept", () => {
  const values = new Map();
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value); },
      removeItem: key => { values.delete(key); },
    },
  });
  const course = {
    id: "timed-course", title: "Timed course", shortDescription: "",
    topics: [
      { ...emptyTopic("short"), sections: [{ heading: "", paragraphs: [words(200)] }] },
      { ...emptyTopic("long"), sections: [{ heading: "", paragraphs: [words(12000)] }] },
    ],
  };
  const other = { ...course, id: "other", topics: [course.topics[0]] };
  try {
    assert.deepEqual(courseProgress(course), { visited: 0, total: 2, totalMinutes: 61, remainingMinutes: 61 });
    markVisited(course.id, "short");
    markVisited(course.id, "short");
    markVisited(course.id, "nonexistent");
    assert.deepEqual(courseProgress(course), { visited: 1, total: 2, totalMinutes: 61, remainingMinutes: 60 });
    assert.deepEqual(overallProgress([course, other]), { visited: 1, total: 3, totalMinutes: 62, remainingMinutes: 61 });
    assert.equal(readingTimeLabel(60, 61), "Est. 1 h remaining / 1 h 1 min total");
    markVisited(course.id, "long");
    assert.equal(readingTimeLabel(courseProgress(course).remainingMinutes, 61), "Est. 0 min remaining / 1 h 1 min total");
    assert.equal(overallProgress([course, other]).remainingMinutes, 1);
    resetProgress();
    assert.equal(overallProgress([course, other]).remainingMinutes, 62);
    assert.deepEqual(overallProgress([]), { visited: 0, total: 0, totalMinutes: 0, remainingMinutes: 0 });
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete globalThis.localStorage;
  }
});

test("completing a concept saves all its topics once and preserves aliases, other concepts, and browser preferences", () => {
  const course = courses.find(course => course.id === "transformations-joins-skew");
  const other = courses.find(candidate => candidate.id !== course.id);
  const original = [
    "pushdown-and-caching/predicate-partition-pruning",
    `${other.id}/${other.topics[0].id}`,
    "older-concept/older-topic",
  ];
  const values = new Map([
    ["de-crash-course-progress", JSON.stringify(original)],
    ["de-crash-course-theme", "light"],
    ["de-crash-course-analytics-consent", "declined"],
  ]);
  let writes = 0;
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => { writes++; values.set(key, value); },
      removeItem: key => { values.delete(key); },
    },
  });
  try {
    markCourseCompleted(course);
    assert.equal(writes, 1, "Bulk completion should use one storage write");
    const stored = JSON.parse(values.get("de-crash-course-progress"));
    for (const marker of original) assert.ok(stored.includes(marker));
    for (const topic of course.topics) {
      assert.ok(stored.includes(`${course.id}/${topic.id}`));
      assert.equal(isVisited(course.id, topic.id), true);
    }
    assert.equal(courseProgress(course).visited, course.topics.length);
    assert.equal(courseProgress(course).remainingMinutes, 0);
    assert.equal(courseProgress(other).visited, 1);
    assert.equal(overallProgress(courses).visited, course.topics.length + 1);
    assert.equal(values.get("de-crash-course-theme"), "light");
    assert.equal(values.get("de-crash-course-analytics-consent"), "declined");
    markCourseCompleted(course);
    assert.deepEqual(JSON.parse(values.get("de-crash-course-progress")), stored, "Repeated completion must not duplicate markers");
    resetProgress();
    assert.equal(courseProgress(course).visited, 0);
    assert.equal(courseProgress(course).remainingMinutes, courseProgress(course).totalMinutes);
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete globalThis.localStorage;
  }
});

test("concept completion updates the page immediately, persists on return, and reports failed saves before retrying", () => {
  const values = new Map();
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const previousError = console.error;
  const errors = [];
  let blocked = false;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => {
        if (blocked) throw new Error("Site storage is blocked");
        values.set(key, value);
      },
      removeItem: key => { values.delete(key); },
    },
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: parseHTML("<html><body></body></html>").document,
  });
  console.error = (...args) => errors.push(args);
  try {
    const course = courses[0];
    markVisited(course.id, course.topics[0].id);
    const page = renderTopicList(course.id);
    const button = page.querySelector(".progress-complete");
    const meter = page.querySelector("progress");
    const estimate = page.querySelector(".reading-time-estimate");
    const initialTime = estimate.textContent;
    assert.equal(button.hidden, false);
    assert.equal(button.disabled, false);
    assert.equal(button.textContent, "Mark as completed");
    assert.equal(button.closest("a"), null, "Completion must not be nested in a navigation link");

    blocked = true;
    button.click();
    assert.equal(errors.length, 1);
    assert.equal(page.querySelector(".progress-save-error").hidden, false);
    assert.equal(button.disabled, false);
    assert.equal(button.textContent, "Mark as completed");
    assert.equal(meter.getAttribute("value"), "1");
    assert.equal(estimate.textContent, initialTime);
    assert.equal(courseProgress(course).visited, 1);
    assert.equal(page.querySelectorAll(".topic-card-visited").length, 1);

    blocked = false;
    button.click();
    assert.equal(page.querySelector(".progress-save-error").hidden, true);
    assert.equal(button.textContent, "Completed");
    assert.equal(button.disabled, true);
    assert.equal(meter.getAttribute("value"), String(course.topics.length));
    assert.equal(page.querySelector(".progress-meter-label").textContent, `${course.topics.length} / ${course.topics.length} read`);
    assert.equal(estimate.textContent, readingTimeLabel(0, courseProgress(course).totalMinutes));
    assert.equal(page.querySelectorAll(".topic-card-visited").length, course.topics.length);

    const returned = renderTopicList(course.id);
    assert.equal(returned.querySelector(".progress-complete").disabled, true);
    assert.equal(returned.querySelector("progress").getAttribute("value"), String(course.topics.length));
    const home = renderHome();
    assert.equal(home.querySelector(".progress-complete"), null, "Completion controls belong only on concept pages");
    assert.equal(home.querySelector(".progress-meter--overall progress").getAttribute("value"), String(course.topics.length));
    assert.equal(home.querySelector(".tile progress").getAttribute("value"), String(course.topics.length));
    resetProgress();
    const reset = renderTopicList(course.id);
    assert.equal(reset.querySelector(".progress-complete").disabled, false);
    assert.equal(reset.querySelector(".progress-complete").textContent, "Mark as completed");
  } finally {
    console.error = previousError;
    if (previousStorage) Object.defineProperty(globalThis, "localStorage", previousStorage);
    else delete globalThis.localStorage;
    if (previousDocument) Object.defineProperty(globalThis, "document", previousDocument);
    else delete globalThis.document;
  }
});

test("home, concept tiles, and concept pages render consistent time and CSP-compatible progress after reading and reset", () => {
  const values = new Map();
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value); },
      removeItem: key => { values.delete(key); },
    },
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: parseHTML("<html><body></body></html>").document,
  });
  try {
    const course = courses[0];
    for (const read of [false, true, false]) {
      if (read) markVisited(course.id, course.topics[0].id);
      else resetProgress();
      const home = renderHome();
      const overall = overallProgress(courses);
      const meter = home.querySelector(".progress-meter--overall");
      assert.equal(meter.querySelector(".reading-time-estimate").textContent, readingTimeLabel(overall.remainingMinutes, overall.totalMinutes));
      assert.equal(meter.querySelector("progress").getAttribute("value"), String(overall.visited));
      assert.equal(meter.querySelector("progress").getAttribute("max"), String(overall.total));
      assert.equal(home.querySelectorAll(".tile-progress .reading-time-estimate").length, courses.length);
      for (const [index, tile] of [...home.querySelectorAll(".tile")].entries()) {
        const progress = courseProgress(courses[index]);
        assert.equal(tile.querySelector(".reading-time-estimate").textContent, readingTimeLabel(progress.remainingMinutes, progress.totalMinutes));
        assert.equal(tile.querySelector("progress").getAttribute("value"), String(progress.visited));
      }
      const page = renderTopicList(course.id);
      const progress = courseProgress(course);
      assert.equal(page.querySelector(".reading-time-estimate").textContent, readingTimeLabel(progress.remainingMinutes, progress.totalMinutes));
      assert.equal(page.querySelector("progress").getAttribute("value"), read ? "1" : "0");
      assert.equal(home.querySelector("[style]"), null);
      assert.equal(page.querySelector("[style]"), null);
    }
  } finally {
    if (previousStorage) Object.defineProperty(globalThis, "localStorage", previousStorage);
    else delete globalThis.localStorage;
    if (previousDocument) Object.defineProperty(globalThis, "document", previousDocument);
    else delete globalThis.document;
  }
});

test("resetting one concept clears its reads, including legacy markers, and keeps other concepts", () => {
  const storageKey = "de-crash-course-progress";
  const merged = courses.find(course => course.id === "transformations-joins-skew");
  const other = courses.find(course => course.id !== merged.id);
  const values = new Map([[storageKey, JSON.stringify([
    "pushdown-and-caching/predicate-partition-pruning",
    `${merged.id}/${merged.topics[0].id}`,
    `${other.id}/${other.topics[0].id}`,
  ])]]);
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value); },
      removeItem: key => { values.delete(key); },
    },
  });
  try {
    resetCourseProgress(merged);
    assert.equal(courseProgress(merged).visited, 0);
    assert.equal(isVisited(other.id, other.topics[0].id), true);
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete globalThis.localStorage;
  }
});
