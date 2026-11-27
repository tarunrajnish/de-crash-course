import { after, test } from "node:test";
import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { createServer } from "vite";
import { parseHTML } from "linkedom";

const server = await createServer({
  mode: "production",
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
  logLevel: "error",
});
after(() => server.close());

const { courses, courseAliases } = await server.ssrLoadModule("/src/content/index.ts");
const { parseHash, parsePath, routeToPath } = await server.ssrLoadModule("/src/lib/router.ts");
const { pageMetadata } = await server.ssrLoadModule("/src/lib/seo.ts");
const { buildSearchIndex } = await server.ssrLoadModule("/src/lib/search.ts");
const { renderPage } = await server.ssrLoadModule("/src/pages/index.ts");
const { cheatsheetGroups } = await server.ssrLoadModule("/src/content/cheatsheet.ts");
const home = new URL(pageMetadata({ name: "home" }).canonical);
const routes = [{ name: "home" }, { name: "about" }, { name: "summary" }];
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

test("production excludes the cheatsheet route, search results, sitemap entry, and bundled tips", async () => {
  await assert.rejects(access("dist/cheatsheet/index.html"), { code: "ENOENT" });
  assert.equal(pageMetadata({ name: "cheatsheet" }).found, false);
  assert.equal(pageMetadata({ name: "cheatsheet" }).canonical, null);
  assert.ok(buildSearchIndex().every(entry => entry.route.name === "topic-detail"));
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
  try {
    globalThis.document = parseHTML("<html><body></body></html>").document;
    assert.equal(renderPage({ name: "cheatsheet" }).querySelector("h1").textContent, "Page not found");
  } finally {
    if (previous) Object.defineProperty(globalThis, "document", previous);
    else delete globalThis.document;
  }
  assert.equal((await readFile("dist/sitemap.xml", "utf8")).includes("/cheatsheet/"), false);
  const files = (await readdir("dist", { recursive: true })).filter(file => /\.(html|js|map)$/.test(file));
  for (const file of files) {
    const text = await readFile(resolve("dist", file), "utf8");
    for (const group of cheatsheetGroups) {
      for (const tip of group.tips) assert.equal(text.includes(tip.id), false, `${file}: ${tip.id}`);
    }
    if (file.endsWith(".html")) {
      const { document } = parseHTML(text);
      assert.equal(document.querySelector('a[href*="/cheatsheet/"]'), null, file);
    }
  }
});

test("the homepage has 12 concept tiles and every lesson remains in exactly one concept", async () => {
  const { document } = parseHTML(await readFile("dist/index.html", "utf8"));
  assert.equal(document.querySelectorAll("a.tile").length, 12);
  const topicIds = courses.flatMap(course => course.topics.map(topic => topic.id));
  const topicFiles = (await readdir("src/content/topics")).filter(file => file.endsWith(".ts"));
  assert.deepEqual(topicIds.sort(), topicFiles.map(file => file.slice(0, -3)).sort());
  const merged = courses.find(course => course.id === "transformations-joins-skew");
  assert.deepEqual(merged.topics.map(topic => topic.id), [
    "narrow-vs-wide", "join-strategies", "partitioning-file-sizing", "skew-and-salting",
    "predicate-partition-pruning", "caching-vs-checkpointing",
  ]);
});

test("merged concept URLs retain static content and point to the surviving canonical pages", async () => {
  for (const alias of courseAliases) {
    const aliasRoutes = [
      { name: "topic-list", courseId: alias.id },
      ...alias.topicIds.map(topicId => ({ name: "topic-detail", courseId: alias.id, topicId })),
    ];
    for (const route of aliasRoutes) {
      const current = { ...route, courseId: alias.courseId };
      const metadata = pageMetadata(current);
      const oldPath = routeToPath(route);
      const { document } = parseHTML(await readFile(outputFile(oldPath), "utf8"));
      assert.deepEqual(parsePath(oldPath), route);
      assert.equal(pageMetadata(route).canonical, metadata.canonical);
      assert.equal(document.title, metadata.title);
      assert.equal(document.querySelector('link[rel="canonical"]').getAttribute("href"), metadata.canonical);
      assert.ok(document.querySelector("h1"));
      assert.equal(document.querySelectorAll(`a[href*="/course/${alias.id}/"]`).length, 0);
      if (route.name === "topic-detail") {
        assert.ok(document.querySelector(".content-section"));
        assert.ok(document.querySelector(".topic-navigation"));
      }
    }
  }
});

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
    const crumbs = document.querySelector('[itemtype="https://schema.org/BreadcrumbList"]');
    if (route.name === "topic-detail" || route.name === "topic-list" || route.name === "about") {
      assert.ok(crumbs, `${pathname}: breadcrumb schema missing`);
      const positions = [...crumbs.querySelectorAll('[itemtype="https://schema.org/ListItem"] [itemprop="position"]')]
        .map(position => position.getAttribute("content"));
      assert.deepEqual(positions, positions.map((_, index) => String(index + 1)), pathname);
    }

    if (route.name === "home") {
      assert.equal(document.querySelectorAll("a.tile").length, courses.length);
      const cheatsheetPath = routeToPath({ name: "cheatsheet" });
      assert.equal(document.querySelector(`#app a[href="${cheatsheetPath}"]`), null);
      assert.equal(document.querySelector(`footer a[href="${cheatsheetPath}"]`), null);
    }
    if (route.name === "topic-list") {
      const course = courses.find(c => c.id === route.courseId);
      assert.equal(document.querySelectorAll(".topic-card a.topic-card-link").length, course.topics.length);
    }
    if (route.name === "topic-detail") {
      const topic = courses.find(c => c.id === route.courseId).topics.find(t => t.id === route.topicId);
      assert.equal(document.querySelector("h1").textContent, topic.title);
      assert.equal(document.querySelectorAll(".content-wrap .content-section").length, topic.sections.length);
      assert.equal(document.querySelectorAll(".self-test-item").length, topic.selfTest.length);
    }
    for (const element of document.querySelectorAll("a[href], script[src], img[src], link[rel='stylesheet'], link[rel='icon']")) {
      const href = element.getAttribute("href") || element.getAttribute("src");
      assert.ok(!href.startsWith("#/"), `Legacy-only link in ${pathname}: ${href}`);
      const url = new URL(href, canonical);
      if (url.origin === home.origin) await access(outputFile(url.pathname));
    }
  }
});

test("static lesson diagrams ship accessible images and captions without enabling animations", async () => {
  const route = { name: "topic-detail", courseId: "spark-delta-basics", topicId: "job-stage-task" };
  const topic = courses.find(course => course.id === route.courseId).topics.find(topic => topic.id === route.topicId);
  const diagram = topic.sections.find(section => section.diagram).diagram;
  const { document } = parseHTML(await readFile(outputFile(routeToPath(route)), "utf8"));
  const figure = document.querySelector(".content-section .lesson-diagram");
  assert.ok(figure, "The visual example must be present in the pre-rendered lesson");
  const image = figure.querySelector("img");
  const expectedUrl = new URL(diagram.src, home);
  assert.equal(image.getAttribute("src"), expectedUrl.pathname);
  assert.equal(image.getAttribute("alt"), diagram.alt);
  assert.ok(image.getAttribute("alt").length > 0);
  assert.equal(figure.querySelector("figcaption").textContent, diagram.caption);
  await access(outputFile(expectedUrl.pathname));
  assert.equal(document.querySelector(".animation-figure"), null);
});

test("every static route excludes disabled Venmo support and keeps the feedback link", async () => {
  const pages = (await readdir("dist", { recursive: true })).filter(file => file.endsWith(".html"));
  for (const page of pages) {
    const { document } = parseHTML(await readFile(resolve("dist", page), "utf8"));
    assert.equal(document.querySelector('#venmo-support, #donation-status, .venmo-logo, a[href*="venmo.com"], img[src*="venmo"], script[src*="venmo"], iframe[src*="venmo"]'), null, page);
    const feedback = document.querySelector('footer a[href="mailto:tarun.rajnish@gmail.com"]');
    assert.equal(feedback?.textContent, "tarun.rajnish@gmail.com", page);
  }
});

test("lesson video recommendations do not repeat videos across topics or timestamps", () => {
  const seen = new Map();
  for (const course of courses) {
    for (const topic of course.topics) {
      for (const video of topic.videos ?? []) {
        const url = new URL(video.url);
        const id = url.hostname === "youtu.be" ? url.pathname.slice(1)
          : url.hostname === "www.youtube.com" || url.hostname === "youtube.com" ? url.searchParams.get("v") : null;
        const key = id ? `youtube:${id}` : video.url;
        assert.equal(seen.has(key), false, `${topic.id} repeats a video used in ${seen.get(key)}`);
        seen.set(key, topic.id);
      }
    }
  }
});

test("every generated HTML page restricts resources to local files and scoped analytics endpoints", async () => {
  const pages = (await readdir("dist", { recursive: true })).filter(file => file.endsWith(".html"));
  for (const page of pages) {
    const { document } = parseHTML(await readFile(resolve("dist", page), "utf8"));
    const policies = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
    assert.equal(policies.length, 1, page);
    const policy = policies[0];
    const directives = new Map(policy.getAttribute("content").split("; ").map(value => {
      const [name, ...sources] = value.split(" ");
      return [name, sources];
    }));
    const inlineScripts = [...document.querySelectorAll("script:not([src])")];
    assert.equal(inlineScripts.length, 1, page);
    const hash = createHash("sha256").update(inlineScripts[0].textContent).digest("base64");
    assert.deepEqual(directives.get("script-src"), ["'self'", `'sha256-${hash}'`, "https://www.googletagmanager.com"], page);
    for (const name of ["style-src", "font-src"]) {
      assert.deepEqual(directives.get(name), ["'self'"], `${page}: ${name}`);
    }
    assert.deepEqual(directives.get("img-src"), ["'self'", "https://www.googletagmanager.com", "https://*.google-analytics.com"], page);
    assert.deepEqual(directives.get("connect-src"), ["https://www.googletagmanager.com", "https://*.google-analytics.com"], page);
    for (const name of ["default-src", "style-src-attr", "object-src", "base-uri", "form-action", "frame-src"]) {
      assert.deepEqual(directives.get(name), ["'none'"], `${page}: ${name}`);
    }
    const head = [...document.head.children];
    assert.ok(head.indexOf(policy) < head.findIndex(element => ["LINK", "SCRIPT"].includes(element.tagName)), page);
    assert.equal(document.querySelector('link[rel="preconnect"]'), null, page);
    for (const element of document.querySelectorAll("script[src], img[src], link[href]")) {
      if (element.getAttribute("rel") === "canonical") continue;
      const url = new URL(element.getAttribute("src") || element.getAttribute("href"), home);
      assert.equal(url.origin, home.origin, `${page}: external resource ${url}`);
    }
  }
});

test("font files are local, deployment-base aware, and shipped with their licenses", async () => {
  const { document } = parseHTML(await readFile("dist/index.html", "utf8"));
  const stylesheets = [...document.querySelectorAll('link[rel="stylesheet"]')];
  const fonts = new Set();
  for (const stylesheet of stylesheets) {
    const css = await readFile(outputFile(new URL(stylesheet.getAttribute("href"), home).pathname), "utf8");
    for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
      if (!match[1].endsWith(".woff2")) continue;
      const url = new URL(match[1], home);
      assert.equal(url.origin, home.origin);
      assert.ok(url.pathname.startsWith(`${home.pathname}fonts/`), url.href);
      const font = await readFile(outputFile(url.pathname));
      assert.equal(font.subarray(0, 4).toString(), "wOF2", url.href);
      fonts.add(url.pathname.split("/").at(-1));
    }
  }
  const expected = (await readdir("public/fonts")).filter(file => file.endsWith(".woff2"));
  assert.ok(expected.length > 0);
  assert.deepEqual([...fonts].sort(), expected.sort());
  for (const family of ["Fraunces", "Inter"]) {
    const license = await readFile(resolve("dist/fonts", `OFL-${family}.txt`), "utf8");
    assert.match(license, /SIL Open Font License, Version 1\.1/);
  }
});

test("worked examples replace attachment prompts with complete static tables or numbered flows", async () => {
  const formats = new Set();
  const plain = text => text.replace(/`([^`]+)`/g, "$1");
  for (const course of courses) {
    for (const topic of course.topics) {
      const path = routeToPath({ name: "topic-detail", courseId: course.id, topicId: topic.id });
      const { document } = parseHTML(await readFile(outputFile(path), "utf8"));
      assert.equal(document.querySelector(".callout-examples, .examples-list"), null, topic.id);
      assert.equal(document.body.textContent.includes("Your examples to attach"), false, topic.id);
      assert.equal("examplesToAttach" in topic, false, topic.id);
      const sections = document.querySelectorAll(".worked-example");
      assert.equal(sections.length, topic.example ? 1 : 0, topic.id);
      if (!topic.example) continue;

      const { example } = topic;
      const section = sections[0];
      assert.ok(example.title && example.description && example.takeaway, topic.id);
      assert.equal(section.querySelector("h3").textContent, example.title);
      assert.equal(section.querySelector(".worked-example-description").textContent, plain(example.description));
      assert.equal(section.querySelector(".worked-example-takeaway").textContent,
        `What to notice: ${plain(example.takeaway)}`);
      assert.equal(document.getElementById(section.getAttribute("aria-labelledby")).textContent, "Worked example");
      if (topic.selfTest.length) assert.ok(section.nextElementSibling.classList.contains("self-test-section"));

      assert.notEqual(Boolean(example.table), Boolean(example.steps), `${topic.id}: choose one visual format`);
      if (example.table) {
        formats.add("table");
        assert.ok(example.table.headers.length >= 2 && example.table.rows.length >= 2, topic.id);
        assert.deepEqual([...section.querySelectorAll("th")].map(cell => cell.textContent), example.table.headers);
        const rows = [...section.querySelectorAll("tbody tr")];
        assert.equal(rows.length, example.table.rows.length, topic.id);
        for (const [index, row] of rows.entries()) {
          assert.equal(example.table.rows[index].length, example.table.headers.length, topic.id);
          assert.deepEqual([...row.querySelectorAll("td")].map(cell => cell.textContent),
            example.table.rows[index].map(plain));
        }
        assert.equal(section.querySelector(".example-flow"), null);
      } else {
        formats.add("steps");
        assert.ok(example.steps.length >= 2, topic.id);
        const steps = [...section.querySelectorAll("ol.example-flow > li")];
        assert.equal(steps.length, example.steps.length, topic.id);
        for (const [index, step] of steps.entries()) {
          assert.ok(example.steps[index].label && example.steps[index].detail, topic.id);
          assert.equal(step.querySelector("strong").textContent, example.steps[index].label);
          assert.equal(step.querySelector("p").textContent, plain(example.steps[index].detail));
        }
        assert.equal(section.querySelector("table"), null);
      }
    }
  }
  assert.deepEqual(formats, new Set(["table", "steps"]));
});

test("topic navigation follows course order and omits unavailable neighbors at each boundary", async () => {
  for (const course of courses) {
    for (const [index, topic] of course.topics.entries()) {
      const path = routeToPath({ name: "topic-detail", courseId: course.id, topicId: topic.id });
      const { document } = parseHTML(await readFile(outputFile(path), "utf8"));
      const navigation = document.querySelector('nav[aria-label="Topic navigation"]');
      assert.ok(navigation, topic.id);
      assert.equal(document.querySelector(".page-topic-detail").lastElementChild, navigation);
      for (const [direction, label, neighbor] of [
        ["prev", "Previous", course.topics[index - 1]],
        ["next", "Next", course.topics[index + 1]],
      ]) {
        const link = navigation.querySelector(`a[rel="${direction}"]`);
        if (!neighbor) {
          assert.equal(link, null, `${topic.id}: no ${direction} beyond course boundary`);
          continue;
        }
        assert.ok(link, `${topic.id}: missing ${direction} link`);
        assert.equal(link.textContent, `${label}: ${neighbor.title}`);
        assert.equal(link.getAttribute("aria-label"), `${label} topic: ${neighbor.title}`);
        assert.equal(link.getAttribute("href"),
          routeToPath({ name: "topic-detail", courseId: course.id, topicId: neighbor.id }));
      }
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

test("the one-page summary covers every topic set and links to each concept", async () => {
  const { summaryCards } = await server.ssrLoadModule("/src/content/summary.ts");
  assert.deepEqual(summaryCards.map(card => card.courseId), courses.map(course => course.id));
  assert.ok(summaryCards.every(card => card.points.length >= 3 && card.points.length <= 4));
  const html = await readFile("dist/summary/index.html", "utf8");
  const { document } = parseHTML(html);
  assert.equal(document.querySelectorAll(".summary-card").length, courses.length);
  for (const course of courses) {
    assert.ok(document.querySelector(`a[href$="/course/${course.id}/"]`), course.id);
  }
});

test("llms.txt provides a plain-text directory of every public topic and the editorial page", async () => {
  const index = await readFile("dist/llms.txt", "utf8");
  assert.match(index, /^# Data Engineering Crash Course/m);
  assert.ok(index.includes(pageMetadata({ name: "about" }).canonical));
  assert.ok(index.includes(pageMetadata({ name: "summary" }).canonical));
  for (const course of courses) {
    assert.ok(index.includes(pageMetadata({ name: "topic-list", courseId: course.id }).canonical), course.id);
    for (const topic of course.topics) {
      assert.ok(index.includes(pageMetadata({
        name: "topic-detail", courseId: course.id, topicId: topic.id,
      }).canonical), topic.id);
    }
  }
  assert.match(index, /Formal per-topic technical review dates are not currently recorded/);
  assert.match(index, /sitemap\.xml/);
});

test("about and lesson pages expose truthful author and review metadata", async () => {
  const about = parseHTML(await readFile(outputFile(routeToPath({ name: "about" })), "utf8")).document;
  assert.equal(about.querySelector('[itemtype="https://schema.org/AboutPage"] h1[itemprop="name"]').textContent,
    "About this course");
  assert.equal(about.querySelector('[itemtype="https://schema.org/Person"] [itemprop="name"]').textContent,
    "Tarun Rajnish");
  assert.match(about.body.textContent, /Formal per-topic technical review dates are not currently recorded/);

  const course = courses[0];
  for (const topic of course.topics) {
    const path = routeToPath({ name: "topic-detail", courseId: course.id, topicId: topic.id });
    const { document } = parseHTML(await readFile(outputFile(path), "utf8"));
    const article = document.querySelector('[itemtype="https://schema.org/Article"]');
    assert.equal(article.querySelector('[itemprop="headline"]').textContent, topic.title);
    assert.equal(article.querySelector('[itemprop="description"]').textContent, topic.shortDescription);
    assert.equal(article.querySelector('[itemprop="author"] [itemprop="name"]').getAttribute("content"), "Tarun Rajnish");
    if (topic.lastReviewed) {
      assert.equal(article.querySelector('[itemprop="dateModified"]').getAttribute("datetime"), topic.lastReviewed);
    } else {
      assert.match(article.querySelector(".topic-attribution").textContent, /Review date not recorded/);
      assert.equal(article.querySelector('[itemprop="dateModified"]'), null);
    }
    const links = [...article.querySelectorAll(".topic-navigation-link")];
    for (const link of links) assert.ok(link.textContent.includes(link.getAttribute("aria-label").replace(/^(Previous|Next) topic: /, "")));
  }
});
