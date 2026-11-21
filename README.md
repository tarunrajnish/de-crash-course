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

Global progress, concept tiles, and concept pages show estimated remaining
and total reading time. Estimates use 200 words per minute, rounded up per
topic, including written lesson content, tables, worked examples, and
self-tests/answers. Video duration and practice time are excluded.
Remaining time drops when topics are opened, matching the existing read
markers, and returns to the total when progress is reset. Estimates and
progress stay device-local; they do not measure time spent reading.

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

The live site is `https://tarunrajnish.github.io/de-crash-course/`.
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

The build includes canonical URLs, Open Graph and Twitter metadata,
`sitemap.xml`, `robots.txt`, `.nojekyll`, and a noindexed `404.html`.
Local builds do not deploy.

The CI workflow uploads the complete `dist/` artifact and deploys it on
pushes to `master` or manual CI runs on `master`. Deployment waits for
the build, tests, dependency audit, Gitleaks, and CodeQL on the same commit.
PRs and other branches run checks without uploading a Pages artifact or
deploying. Security is a reusable workflow, so CI does not duplicate scans
in a separate push-triggered run.

Before pushing the deployment workflow, select repository
**Settings > Pages > Source: GitHub Actions**. Pages enablement remains
manual. The deployment job uses the `github-pages` environment and serializes
publishing without cancelling an active deployment. Only that job gets
`pages: write` and `id-token: write`; no personal token is stored in the
workflow. A manual rerun of **Actions > CI > Run workflow** on `master`
rechecks the commit before deploying.

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

## Security checks

CI runs `npm audit --audit-level=high`, including development dependencies,
and fails for high/critical advisories. Review lower-severity findings too.
CI calls the Security workflow on pushes/PRs to `master`/`main` and manual
CI runs. Security also runs weekly and can run manually without deploying.
It checks all fetched Git history, working files, and freshly
built `dist/` with Gitleaks, and runs CodeQL's JavaScript/TypeScript
`security-extended` queries. Scanner errors fail the job.

Actions are pinned to commit SHAs; the Gitleaks download is pinned to a
version and SHA-256 checksum. CI builds with Node.js 24, and JavaScript
Actions use Node.js 24 runtimes. Pages uploads include hidden files to
preserve `.nojekyll`. Tokens default to read-only, checkout does
not persist credentials, and only CodeQL receives alert-upload permissions.
Only the gated deployment job receives Pages/OIDC write permissions.
Dependabot checks npm dependencies and Actions weekly. Review its updates,
including security-scanner versions and checksums.

For local checks, install the Gitleaks CLI if needed, then run:

```bash
npm audit --audit-level=high
gitleaks git --log-opts="--all" --redact --ignore-gitleaks-allow .
gitleaks dir --config .gitleaks.toml --redact --ignore-gitleaks-allow .
npm run build
gitleaks dir --config .gitleaks.toml --redact --ignore-gitleaks-allow dist
```

The configuration retains Gitleaks' default rules and excludes installed
`node_modules/` and Git internals, not generated public files. Redaction
keeps matched secret values out of scanner logs; still treat reports as
sensitive. If a real credential is found, revoke/rotate it before removing
it from files or coordinating any history cleanup. Never hide it with an
allowlist merely to pass CI.

On 2026-11-20, a scoped manual review found no confirmed exploitable
vulnerabilities in the examined rendering/routing/storage/build/CI
boundaries. Local npm audit reported zero advisories, and Gitleaks found
no secrets across 90 available commits, working files, and generated output.
These are point-in-time results, not a security guarantee.
The repository is now published at
`https://github.com/tarunrajnish/de-crash-course`. CI, Gitleaks, and CodeQL
completed successfully on GitHub on 2026-11-20; the repository owner reported
no CodeQL alerts. These results apply to the scanned commit and do not
replace review of future alerts or the final hosting checks.
Avoid enabling a second default-setup CodeQL scan alongside this workflow.

Before deployment, require the build and security checks in branch rules,
review CodeQL results, and verify the actual hosting configuration.
Production pages now include a restrictive meta CSP before resource loads.
The build hashes the exact early theme script; other inline scripts, inline
style attributes, dynamic code evaluation, background connections, forms,
objects, and frames are blocked. Scripts/styles/fonts/images load only from
the site's origin. This policy is added during pre-rendering, not development,
so Vite's local HMR remains usable.

Fraunces and Inter are self-hosted WOFF2 files with their existing weights,
styles, and language subsets. Their SIL Open Font licenses are shipped in
`public/fonts/`; normal page loading no longer contacts Google Fonts.
Files came from Google Fonts' Fraunces v38 and Inter v20 distributions.
Keep the licenses with redistributed fonts.

A meta CSP cannot enforce `frame-ancestors` or supply host-level headers
such as HSTS. GitHub Pages header limitations, actual production behavior,
and clickjacking protection on a future header-capable host still need
a separate launch check. Tests verify CSP hashes/order across generated
pages and local font URLs at project-site and custom-domain bases.

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
- `src/lib/readingTime.ts`: content-based reading estimates shared by progress displays
- `src/lib/icons.ts`: small decorative SVG icon set used on topic cards
- `src/pages/*.ts`: home, topic list, and topic detail page renderers
- `src/style.css`: palette and layout (dark-default, green accent, rose
  used for callouts and active definition terms)
- `src/fonts.css`, `public/fonts/`: self-hosted Fraunces/Inter and their licenses
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

For a static visual, a content section can include `diagram` with a local
`src`, descriptive `alt`, and optional `caption`. Put SVG assets in
`public/assets/`; diagrams render independently of the disabled animations.
Captions contribute to reading-time estimates. Keep the explanation in
lesson text as well so the example remains accessible without the image.

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
