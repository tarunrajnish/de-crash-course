import { after, test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({
  mode: "production",
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
  logLevel: "error",
  plugins: [{
    name: "test-browser-progress",
    enforce: "pre",
    transform(code, id) {
      if (id.endsWith("/src/lib/progress.ts")) return code.replaceAll("import.meta.env.SSR", "false");
    },
  }],
});
after(() => server.close());

const { courses } = await server.ssrLoadModule("/src/content/index.ts");
const { courseProgress, overallProgress, isVisited, markVisited, resetProgress } =
  await server.ssrLoadModule("/src/lib/progress.ts");

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
    assert.deepEqual(courseProgress(merged), { visited: 2, total: 6 });
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
    assert.deepEqual(courseProgress(merged), { visited: 2, total: 6 });
    assert.equal(overallProgress(courses).visited, 3);

    markVisited(merged.id, "skew-and-salting");
    assert.deepEqual(courseProgress(merged), { visited: 3, total: 6 });
    assert.equal(overallProgress(courses).visited, 4);
    resetProgress();
    assert.deepEqual(courseProgress(merged), { visited: 0, total: 6 });
    assert.equal(overallProgress(courses).visited, 0);
    assert.equal(isVisited("pushdown-and-caching", "caching-vs-checkpointing"), false);
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete globalThis.localStorage;
  }
});
