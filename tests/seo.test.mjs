import { after, test } from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer } from "vite";
import { parseHTML } from "linkedom";

const server = await createServer({
  mode: "production",
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});
after(() => server.close());

const { courses } = await server.ssrLoadModule("/src/content/index.ts");
const { parseHash, parsePath, routeToPath } = await server.ssrLoadModule("/src/lib/router.ts");
const { pageMetadata } = await server.ssrLoadModule("/src/lib/seo.ts");
const home = new URL(pageMetadata({ name: "home" }).canonical);
const routes = [{ name: "home" }];
for (const course of courses) {
  routes.push({ name: "topic-list", courseId: course.id });
  for (const topic of course.topics) {
    routes.push({ name: "topic-detail", courseId: course.id, topicId: topic.id });
  }
}

function outputFile(pathname) {
  assert.ok(pathname.startsWith(home.pathname), `URL outside the deployment base: ${pathname}`);
  const relative = pathname.slice(home.pathname.length);
  return resolve("dist", relative.endsWith("/") || !relative ? `${relative}index.html` : relative);
}

test("clean routes round-trip at project and custom-domain roots", () => {
  for (const base of ["/de-crash-course/", "/"]) {
    for (const route of routes) {
      const path = routeToPath(route, base);
      assert.equal(path.includes("#"), false);
      assert.deepEqual(parsePath(path, base), route);
      assert.deepEqual(parsePath(`${path}index.html`, base), route);
    }
    const encoded = { name: "topic-detail", courseId: "spaces & symbols", topicId: "unicode-é" };
    assert.deepEqual(parsePath(routeToPath(encoded, base), base), encoded);
  }
});

test("legacy links resolve and invalid routes do not become the homepage", () => {
  assert.deepEqual(parseHash("#/"), { name: "home" });
  assert.deepEqual(parseHash("#/course/spark-delta-basics/topic/what-is-spark"), {
    name: "topic-detail", courseId: "spark-delta-basics", topicId: "what-is-spark",
  });
  for (const path of ["/other/", "/de-crash-course/unknown/", "/de-crash-course/course/%zz/"]) {
    assert.equal(parsePath(path, "/de-crash-course/").name, "not-found");
  }
  assert.equal(pageMetadata({ name: "topic-list", courseId: "missing" }).found, false);
  assert.equal(pageMetadata({ name: "topic-detail", courseId: courses[0].id, topicId: "missing" }).found, false);
});

test("every page ships full HTML, unique metadata, and working internal links without JavaScript", async () => {
  const titles = new Set();
  const canonicals = new Set();
  for (const route of routes) {
    const metadata = pageMetadata(route);
    const pathname = new URL(metadata.canonical).pathname;
    const { document } = parseHTML(await readFile(outputFile(pathname), "utf8"));
    assert.equal(document.title, metadata.title);
    assert.ok(!titles.has(document.title), `Duplicate title: ${document.title}`);
    titles.add(document.title);
    const canonical = document.querySelector('link[rel="canonical"]').getAttribute("href");
    assert.equal(canonical, metadata.canonical);
    assert.ok(!canonicals.has(canonical), `Duplicate canonical: ${canonical}`);
    canonicals.add(canonical);
    assert.equal(document.querySelector('meta[name="description"]').getAttribute("content"), metadata.description);
    assert.equal(document.querySelector('meta[property="og:url"]').getAttribute("content"), canonical);
    assert.equal(document.querySelector('meta[property="og:title"]').getAttribute("content"), metadata.title);
    assert.equal(document.querySelector('meta[name="twitter:description"]').getAttribute("content"), metadata.description);
    assert.equal(document.querySelectorAll("h1").length, 1, pathname);
    assert.equal(document.querySelectorAll(".topic-card-visited").length, 0);

    if (route.name === "home") assert.equal(document.querySelectorAll("a.tile").length, courses.length);
    if (route.name === "topic-list") {
      const course = courses.find(c => c.id === route.courseId);
      assert.equal(document.querySelectorAll("a.topic-card").length, course.topics.length);
    }
    if (route.name === "topic-detail") {
      const topic = courses.find(c => c.id === route.courseId).topics.find(t => t.id === route.topicId);
      assert.equal(document.querySelector("h1").textContent, topic.title);
      assert.equal(document.querySelectorAll(".content-wrap .content-section").length, topic.sections.length);
      assert.equal(document.querySelectorAll(".self-test-item").length, topic.selfTest.length);
    }
    for (const element of document.querySelectorAll("a[href], script[src], link[rel='stylesheet'], link[rel='icon']")) {
      const href = element.getAttribute("href") || element.getAttribute("src");
      assert.ok(!href.startsWith("#/"), `Legacy-only link in ${pathname}: ${href}`);
      const url = new URL(href, canonical);
      if (url.origin === home.origin) await access(outputFile(url.pathname));
    }
  }
});

test("sitemap lists exactly the canonical pages; 404 is excluded and noindexed", async () => {
  const sitemap = await readFile("dist/sitemap.xml", "utf8");
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
  assert.deepEqual(urls.sort(), routes.map(route => pageMetadata(route).canonical).sort());
  const { document } = parseHTML(await readFile("dist/404.html", "utf8"));
  assert.equal(document.querySelector("h1").textContent, "Page not found");
  assert.equal(document.querySelector('meta[name="robots"]').getAttribute("content"), "noindex, follow");
  assert.equal(document.querySelector('link[rel="canonical"]'), null);
  const robots = await readFile("dist/robots.txt", "utf8");
  assert.ok(robots.includes(`Sitemap: ${home.href}sitemap.xml`));
  await access("dist/.nojekyll");
});
