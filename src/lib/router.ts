export type Route =
  | { name: "home" }
  | { name: "cheatsheet" }
  | { name: "topic-list"; courseId: string }
  | { name: "topic-detail"; courseId: string; topicId: string }
  | { name: "not-found" };

function parseSegments(path: string): Route {
  let parts: string[];
  try {
    parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  } catch (error) {
    if (error instanceof URIError) return { name: "not-found" };
    throw error;
  }

  if (parts.length === 0) return { name: "home" };
  if (parts.length === 1 && parts[0] === "cheatsheet") return { name: "cheatsheet" };
  if (parts[0] === "course" && parts.length === 2) {
    return { name: "topic-list", courseId: parts[1] };
  }
  if (parts[0] === "course" && parts.length === 4 && parts[2] === "topic") {
    return { name: "topic-detail", courseId: parts[1], topicId: parts[3] };
  }
  return { name: "not-found" };
}

export function parseHash(hash: string): Route {
  return parseSegments(hash.replace(/^#\/?/, ""));
}

export function parsePath(pathname: string, base = import.meta.env.BASE_URL): Route {
  const path = pathname.replace(/\/index\.html$/, "/");
  if (path === base) return { name: "home" };
  if (!path.startsWith(base)) return { name: "not-found" };
  return parseSegments(path.slice(base.length));
}

export function routeToPath(route: Route, base = import.meta.env.BASE_URL): string {
  switch (route.name) {
    case "home":
      return base;
    case "cheatsheet":
      return `${base}cheatsheet/`;
    case "topic-list":
      return `${base}course/${encodeURIComponent(route.courseId)}/`;
    case "topic-detail":
      return `${base}course/${encodeURIComponent(route.courseId)}/topic/${encodeURIComponent(route.topicId)}/`;
    case "not-found":
      return `${base}404.html`;
  }
}

export function navigate(route: Route, fragment?: string) {
  window.location.assign(routeToPath(route) + (fragment ? `#${encodeURIComponent(fragment)}` : ""));
}

export function onRouteChange(handler: (route: Route) => void) {
  const listener = () => {
    if (window.location.hash.startsWith("#/")) {
      window.location.replace(routeToPath(parseHash(window.location.hash)));
      return;
    }
    handler(parsePath(window.location.pathname));
  };
  const hashListener = () => {
    if (window.location.hash.startsWith("#/")) listener();
  };
  window.addEventListener("hashchange", hashListener);
  listener();
  return () => window.removeEventListener("hashchange", hashListener);
}
