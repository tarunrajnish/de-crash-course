# Data Engineering Crash Course

A static, local reference site for data engineering interview prep: Spark,
Delta Lake, and Structured Streaming fundamentals, plus data modeling,
orchestration, data quality, lakehouse storage, Databricks, production
engineering, technical ownership, and AI × data engineering.
Homepage tile grid of topic sets, drill into a topic list, drill into a
detail page with taught content, embedded SVG animations where available,
video links, "examples to attach" callouts, and a click-to-reveal practice
section.

## Coverage

| Area | Topic coverage |
| --- | --- |
| Data engineering and architecture | Modeling and warehousing; orchestration; batch, incremental, streaming, and CDC platform design |
| Databricks and data technologies | Databricks jobs, SQL and PySpark transformations, Spark internals, and Delta Lake writes |
| Data quality and integration | Contracts, schema evolution, validation, producer/consumer interfaces, and reliable data products |
| Production engineering | CI/CD, environment promotion, deployment recovery, automated tests, SLOs, and production support |
| Governance and security | Unity Catalog, least-privilege access, workload identities, storage permissions, lineage, and auditing |
| Performance and optimization | Query plans, joins, skew, pruning, file layout, capacity, and cost per successful output |
| Engineering excellence | Reusable components, coding standards, automation, failure testing, troubleshooting, and root-cause analysis |
| Technical ownership and leadership | Consumer acceptance, cross-team contracts, architectural decisions, pragmatic delivery, and operational handover |

## Stack

Vite + vanilla TypeScript. No frontend framework, no backend. All content lives as
typed data modules under `src/content/topics/`. Dark theme by default, with
a light/dark toggle persisted in `localStorage`.
The production build uses LinkeDOM at build time to pre-render every page
through the same renderers used in the browser.

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL (defaults to `http://localhost:5173/de-crash-course/`).

## SEO and static publishing

The initial public URL is `https://tarunrajnish.github.io/de-crash-course/`.
Course and topic links use real paths with trailing slashes. The build
creates an `index.html` in each route directory, containing the taught
content, self-tests, crawlable links, and page-specific metadata before
JavaScript runs. Client-side code adds search, theme switching, copy
buttons, and device-local reading progress. Old `#/course/...` links
redirect to their clean-URL equivalents when JavaScript is enabled.

```bash
npm run build
npm test
npm run preview
```

Publish the entire `dist/` directory, using GitHub Pages' GitHub Actions
publishing source. The build includes canonical URLs, Open Graph and Twitter
metadata, `sitemap.xml`, `robots.txt`, `.nojekyll`, and a noindexed `404.html`.
It does not deploy the site or configure Pages automatically.

To switch domains, rebuild with the final public URL, including any path
prefix. For a custom domain serving the site at its root:

```bash
VITE_SITE_URL=https://example.com/ npm run build
```

This updates asset paths, navigation, canonical URLs, and the sitemap
together. Use the same variable in deployment CI and in `npm run preview`
when previewing an alternate-domain build. Configure custom-domain DNS
and GitHub Pages settings separately.

After launch, verify the site in Google Search Console and submit
`https://tarunrajnish.github.io/de-crash-course/sitemap.xml`.
Search engines only honor `robots.txt` at a hostname's root; a project
site's copy under `/de-crash-course/` does not control the account-wide
`tarunrajnish.github.io` host. Submit the sitemap directly for this project.

## Project layout

- `src/content/types.ts`: shared content types (`Topic`, `Course`, etc.)
- `src/content/topics/*.ts`: one file per topic's taught content
- `src/content/index.ts`: assembles the course and topic lookups
- `src/lib/router.ts`: clean-path routes and legacy hash-link redirects
- `src/lib/seo.ts`: shared page metadata for the browser and static build
- `scripts/prerender.mjs`: generates static pages and discovery files
- `src/lib/theme.ts`: dark/light theme toggle, persisted in `localStorage`
- `src/lib/icons.ts`: small decorative SVG icon set used on topic cards
- `src/pages/*.ts`: home, topic list, and topic detail page renderers
- `src/style.css`: palette and layout (dark-default, green accent, rose
  reserved for cost/gotcha callouts)
- `public/assets/*.svg`: embedded SMIL animations (narrow vs. wide, join
  strategies, skew and salting), currently disabled via `SHOW_ANIMATIONS` in
  `src/pages/topicDetail.ts`

## Adding a topic

Add a new file under `src/content/topics/`, export a `Topic` object matching
the shape in `src/content/types.ts`, and add it to a course's `topics` array
in `src/content/index.ts` (or define a new `Course` and add it to the
`courses` array).
