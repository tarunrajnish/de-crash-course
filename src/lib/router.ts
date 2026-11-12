export type Route =
  | { name: "home" }
  | { name: "topic-list"; courseId: string }
  | { name: "topic-detail"; courseId: string; topicId: string };

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, "");
  const parts = clean.split("/").filter(Boolean).map(decodeURIComponent);

  if (parts.length === 0) return { name: "home" };
  if (parts[0] === "course" && parts.length === 2) {
    return { name: "topic-list", courseId: parts[1] };
  }
  if (parts[0] === "course" && parts.length === 4 && parts[2] === "topic") {
    return { name: "topic-detail", courseId: parts[1], topicId: parts[3] };
  }
  return { name: "home" };
}

export function routeToHash(route: Route): string {
  switch (route.name) {
    case "home":
      return "#/";
    case "topic-list":
      return `#/course/${encodeURIComponent(route.courseId)}`;
    case "topic-detail":
      return `#/course/${encodeURIComponent(route.courseId)}/topic/${encodeURIComponent(route.topicId)}`;
  }
}

export function navigate(route: Route) {
  window.location.hash = routeToHash(route);
}

export function onRouteChange(handler: (route: Route) => void) {
  const listener = () => handler(parseHash(window.location.hash));
  window.addEventListener("hashchange", listener);
  listener();
  return () => window.removeEventListener("hashchange", listener);
}
