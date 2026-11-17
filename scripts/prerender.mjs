import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { createServer } from "vite";
import { parseHTML } from "linkedom";

const server = await createServer({
  mode: "production",
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

try {
  const { courses } = await server.ssrLoadModule("/src/content/index.ts");
  const { renderPage } = await server.ssrLoadModule("/src/pages/index.ts");
  const { routeToPath } = await server.ssrLoadModule("/src/lib/router.ts");
  const { applyPageMetadata, pageMetadata } = await server.ssrLoadModule("/src/lib/seo.ts");
  const output = resolve(server.config.root, server.config.build.outDir);
  const template = await readFile(resolve(output, "index.html"), "utf8");
  const routes = [{ name: "home" }];
  for (const course of courses) {
    routes.push({ name: "topic-list", courseId: course.id });
    for (const topic of course.topics) {
      routes.push({ name: "topic-detail", courseId: course.id, topicId: topic.id });
    }
  }
  const urls = [];
  for (const route of [...routes, { name: "not-found" }]) {
    const { document } = parseHTML(template);
    globalThis.document = document;
    document.querySelector("#app").replaceChildren(renderPage(route));
    applyPageMetadata(route);
    const path = routeToPath(route).slice(server.config.base.length);
    const file = route.name === "not-found" ? "404.html" : `${path}index.html`;
    const destination = resolve(output, file);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, document.toString());
    const { canonical } = pageMetadata(route);
    if (canonical) urls.push(canonical);
  }
  const escapeXml = value => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  await writeFile(resolve(output, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(url => `  <url><loc>${escapeXml(url)}</loc></url>`).join("\n") +
    "\n</urlset>\n");
  const site = pageMetadata({ name: "home" }).canonical;
  await writeFile(resolve(output, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${site}sitemap.xml\n`);
  await writeFile(resolve(output, ".nojekyll"), "");
  console.log(`Pre-rendered ${routes.length} pages, a 404 page, and sitemap.xml.`);
} finally {
  delete globalThis.document;
  await server.close();
}
