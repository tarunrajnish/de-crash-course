import { findCourse, findTopic } from "../content";
import type { Route } from "./router";
import { routeToPath } from "./router";

const SITE_NAME = "Data Engineering Crash Course";
const HOME_DESCRIPTION =
  "Free data engineering interview prep covering Spark, Delta Lake, SQL, Databricks, pipelines, data quality, AI, and production engineering.";

export function pageMetadata(route: Route) {
  let canonicalRoute = route;
  let title = SITE_NAME;
  let description = HOME_DESCRIPTION;
  let found = route.name !== "not-found";
  if (route.name === "cheatsheet") {
    title = `SQL, Python & data engineering cheatsheet | ${SITE_NAME}`;
    description = "Search quick SQL, MySQL, Python, and data engineering tips, common mistakes, code examples, and interview memory aids.";
  } else if (route.name === "topic-list") {
    const course = findCourse(route.courseId);
    found = Boolean(course);
    if (course) {
      canonicalRoute = { ...route, courseId: course.id };
      title = `${course.title} | ${SITE_NAME}`;
      description = course.shortDescription;
    }
  } else if (route.name === "topic-detail") {
    const entry = findTopic(route.courseId, route.topicId);
    found = Boolean(entry);
    if (entry) {
      canonicalRoute = { ...route, courseId: entry.course.id };
      title = `${entry.topic.title} | ${SITE_NAME}`;
      description = entry.topic.shortDescription;
    }
  }
  const site = new URL(import.meta.env.VITE_SITE_URL);
  return {
    title: found ? title : `Page not found | ${SITE_NAME}`,
    description: found ? description : "This page could not be found. Browse the data engineering course topics.",
    canonical: found ? new URL(routeToPath(canonicalRoute), site.origin).href : null,
    type: route.name === "topic-detail" && found ? "article" : "website",
    found,
  };
}

export function applyPageMetadata(route: Route): void {
  const meta = pageMetadata(route);
  document.title = meta.title;
  function setMeta(attribute: "name" | "property", key: string, content: string) {
    let node = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
    if (!node) {
      node = document.createElement("meta");
      node.setAttribute(attribute, key);
      document.head.appendChild(node);
    }
    node.content = content;
  }
  setMeta("name", "description", meta.description);
  setMeta("name", "robots", meta.found ? "index, follow" : "noindex, follow");
  setMeta("property", "og:site_name", SITE_NAME);
  setMeta("property", "og:title", meta.title);
  setMeta("property", "og:description", meta.description);
  setMeta("property", "og:type", meta.type);
  setMeta("name", "twitter:card", "summary");
  setMeta("name", "twitter:title", meta.title);
  setMeta("name", "twitter:description", meta.description);

  document.head.querySelector('link[rel="canonical"]')?.remove();
  document.head.querySelector('meta[property="og:url"]')?.remove();
  if (meta.canonical) {
    const canonical = document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = meta.canonical;
    document.head.appendChild(canonical);
    setMeta("property", "og:url", meta.canonical);
  }
}
