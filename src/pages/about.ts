import { el } from "../lib/dom";
import { breadcrumb } from "../lib/breadcrumb";
import { routeToPath } from "../lib/router";

export function renderAbout(): HTMLElement {
  const root = el("article", {
    className: "page page-about",
    attrs: { itemscope: "", itemtype: "https://schema.org/AboutPage" },
  });
  root.appendChild(breadcrumb([
    { label: "Home", route: { name: "home" } },
    { label: "About", route: { name: "about" } },
  ]));
  root.appendChild(el("h1", {
    className: "page-title",
    text: "About this course",
    attrs: { itemprop: "name" },
  }));
  const author = el("p", {
    className: "about-byline",
    attrs: { itemprop: "author", itemscope: "", itemtype: "https://schema.org/Person" },
  });
  author.appendChild(document.createTextNode("Created and maintained by "));
  author.appendChild(el("span", { text: "Tarun Rajnish", attrs: { itemprop: "name" } }));
  root.appendChild(author);
  root.appendChild(el("p", {
    className: "page-subtitle",
    text: "A free, independent study resource for data engineering concepts, interview preparation, and day-to-day work.",
    attrs: { itemprop: "description" },
  }));
  const content = el("div", { className: "about-content" });
  content.append(
    el("h2", { text: "How the material is organized" }),
    el("p", {
      text: "The course covers Spark, Delta Lake, data modeling, orchestration, data quality, lakehouse storage, AI data systems, Databricks, and production engineering. Lessons pair explanations with examples and self-tests. The one-page summary offers a compact revision path.",
    }),
    el("h2", { text: "Editorial status" }),
    el("p", {
      text: "The site is maintained as an independent learning resource. Formal per-topic technical review dates are not currently recorded, so no review date is claimed. Content may change; corrections and suggestions are welcome.",
    }),
    el("p", {}, [
      document.createTextNode("Contact: "),
      el("a", {
        text: "tarun.rajnish@gmail.com",
        attrs: { href: "mailto:tarun.rajnish@gmail.com" },
      }),
    ]),
    el("h2", { text: "Explore" }),
    el("ul", {}, [
      el("li", {}, [el("a", { text: "Browse all topic sets", attrs: { href: routeToPath({ name: "home" }) } })]),
      el("li", {}, [el("a", { text: "Open the one-page summary", attrs: { href: routeToPath({ name: "summary" }) } })]),
    ]),
  );
  root.appendChild(content);
  return root;
}
