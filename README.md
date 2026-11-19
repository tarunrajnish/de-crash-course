# Data Engineering Crash Course

A static, local reference site for data engineering interview prep: Spark,
Delta Lake, and Structured Streaming fundamentals, plus data modeling,
orchestration, data quality, lakehouse storage, Databricks, production
engineering, technical ownership, and AI × data engineering.
Homepage tile grid of topic sets, drill into a topic list, drill into a
detail page with taught content, embedded SVG animations where available,
video links, compact worked-example tables and step flows, and a click-to-reveal practice
section.
Previous and Next links at the end of each lesson follow the order within
its concept, stopping at the first and last topics.

Each lesson selects around five core concepts, with a maximum of ten.
Only the first occurrence of each concept in the lesson body gets a
theme-aware accent color;
titles, headings, and repeated mentions stay plain. Hover, focus with the
keyboard, or tap a term to read its definition. Escape or an outside click
dismisses the explanation.

## Coverage

The homepage has 12 concept tiles. Spark performance and optimization
groups joins, partitioning, skew, predicate pushdown, and caching together.
Older pushdown/caching links and device-local reading progress remain supported.

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
JavaScript runs. Client-side code adds search, theme switching, inline
definitions, and device-local reading progress. Old `#/course/...` links
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
- `src/content/cheatsheet.ts`: quick-reference tips grouped by SQL, Python,
  and data engineering
- `src/content/glossary.ts`: shared definitions and aliases, selected per topic
- `src/lib/glossary.ts`: word-boundary-aware annotation of lesson text
- `src/lib/glossaryTooltip.ts`: shared hover, focus, and tap explanations
- `src/lib/router.ts`: clean-path routes and legacy hash-link redirects
- `src/lib/seo.ts`: shared page metadata for the browser and static build
- `scripts/prerender.mjs`: generates static pages and discovery files
- `src/lib/theme.ts`: dark/light theme toggle, persisted in `localStorage`
- `src/lib/icons.ts`: small decorative SVG icon set used on topic cards
- `src/pages/*.ts`: home, topic list, and topic detail page renderers
- `src/style.css`: palette and layout (dark-default, green accent, rose
  used for callouts and active definition terms)
- `public/assets/*.svg`: embedded SMIL animations (narrow vs. wide, join
  strategies, skew and salting), currently disabled via `SHOW_ANIMATIONS` in
  `src/pages/topicDetail.ts`

## Adding a topic

Add a new file under `src/content/topics/`, export a `Topic` object matching
the shape in `src/content/types.ts`, and add it to a course's `topics` array
in `src/content/index.ts` (or define a new `Course` and add it to the
`courses` array).
Aim for around five core concepts in the topic's required `glossary` array,
with a hard maximum of ten.
Prefer a short, lesson-specific list over basic vocabulary or incidental
technology mentions. Each concept is annotated only once per topic.
Reuse entries from `src/content/glossary.ts`, or add a concise definition
and any unambiguous aliases there. Definitions apply to lesson text,
tables, examples, and self-tests. Code chips get definitions only when
their entire value matches a selected term. Snippets retain code formatting
without copy buttons or clipboard integration.

Use the optional `example` field for one small, concrete worked example:
a `title`, `description`, and `takeaway`, plus either a `table` with headers
and rows or `steps` with labels and details. Keep tables compact and flows
short. Show actual inputs and outcomes; label hypothetical performance
and cost figures as illustrative. Examples appear before the self-test
and use the lesson's existing glossary selections.

## Adding a quick tip

Store concise hints in the appropriate group in `src/content/cheatsheet.ts`.
Give each tip a stable, globally unique `id`, a searchable title, short
paragraphs, and an optional code example. Use backticks for inline code.
Focus each tip on one syntax pattern or concept. Use a short explanation
and minimal generic snippets; omit exercise prompts, named problem solutions,
walkthroughs, and expected-output narratives.
Include dialect, version, or input assumptions where correctness depends
on them. Existing tip IDs are shareable anchors and should remain stable.

The cheatsheet is a personal interview reference linked only from the footer at `/cheatsheet/`
under the configured deployment base. Readers can filter by text and
category, and the global search includes each tip's title, explanation,
and code. All entries are pre-rendered for direct links and reading without
JavaScript. Tips do not affect lesson reading progress.
