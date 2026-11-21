# Feature list

Prioritized backlog and implementation status. Priorities describe
recommended order; listing a feature does not authorize its implementation
or infrastructure changes.

## Recommended order

| Priority | Work | Completion criterion |
| --- | --- | --- |
| P0: before publication | Complete security launch gates | Local scoped review, dependency audit, secret scans, CSP, and self-hosted fonts completed; GitHub CodeQL passed and owner reported no alerts; review public content and final hosting behavior |
| P0: release confidence | Browser regression checks | Verify direct navigation, search, theme/progress persistence, reset, and mobile layouts; current SEO tests cover generated HTML and routing, not all browser interactions |
| P1: publish | Pages deployment complete | Personal repository and live site published; build/tests/audit, Gitleaks, and CodeQL gate each master deployment |
| P1: verify launch | Finish discovery and launch checks | Live HTTPS, direct pages, assets/fonts, CSP hashes, canonical URLs, and an actual HTTP 404 verified; finish browser regression checks, submit the sitemap, and inspect Search Console |
| P1: user feedback | Footer suggestion/correction box | Readers can submit written feedback that reaches the owner's email; confirm the recipient and delivery service before implementation |
| P2: optional support | Footer Venmo donation link | A low-key, optional support link opens the owner's Venmo profile, `@tarunrajnish` |
| P2: learning navigation | Section/question anchors and related-topic links | Readers can share a specific section and discover connected concepts |
| P2: interview preparation | Print stylesheet and PDF output | Topics print with readable tables and an intentional policy for revealed answers, without navigation controls |
| P3: optional support reminders | Reading milestone donation prompts | Small, dismissible prompts at 5%, 25%, 50%, 75%, and 100% overall progress link to the same Venmo profile without blocking reading |
| P3: convenience | Additional keyboard navigation | Keyboard shortcuts complement standard links, tab navigation, and existing search shortcuts without interfering with text inputs |
| Optional | Custom domain and analytics decision | Configure a domain when chosen; revisit privacy requirements before introducing visitor analytics |

A scoped manual review and local dependency/secret scans were completed
on 2026-11-20. No confirmed exploitable vulnerability, dependency advisory,
or secret was found in those checks. GitHub CI and Security checks passed;
the owner reported no CodeQL alerts. Hosting checks and a public-content review
remain launch gates; the checks are not a comprehensive security guarantee.

## User experience

- **Footer suggestion/correction box (P1, planned)**: readers can write a
  suggestion or correction in the footer and submit it to the owner's email.
  Include the page URL so a correction can be located. Confirm the recipient
  email and delivery service before implementation: GitHub Pages cannot send
  email itself. A managed form service or serverless endpoint needs spam
  protection, clear submission/error states, and a narrowly scoped CSP update.
  Keep mail credentials outside the frontend and repository; confirm successful
  submission before showing a success message.

- **Footer Venmo donation link (P2, planned)**: link to `@tarunrajnish` with
  optional, low-pressure wording such as "Found this useful? Support via Venmo."
  Keep it in the footer and open the profile directly, without payment forms,
  suggested amounts, or payment tracking on this site.

- **Reading milestone donation prompts (P3, planned)**: use overall, local
  reading progress to offer the same optional Venmo link when a reader reaches
  5%, 25%, 50%, 75%, and 100%. Recommend a small, non-modal, dismissible toast
  that leaves lessons and navigation accessible and never takes keyboard focus.
  Remember shown milestones locally across reloads and deployments.
  Avoid prompts on every page load or several prompts in succession; show at
  most one per visit and defer it while search is open. Finalize milestone
  catch-up and progress-reset behavior before implementation. No donation is
  required to continue reading. The site does not track donations or transmit
  reading progress.

- **Concept organization**: 12 homepage tiles. Spark performance and
  optimization combines joins, partitioning, skew, pushdown, and caching.
  Existing lesson links and read progress are preserved after the merge.
  Phone widths of 600px and below use two compact card columns; larger
  screens retain the existing card size. Search and theme buttons share
  a flex row, with 44px minimum tap targets on phones.

- **Quick-reference cheatsheet**: implemented with SQL, Python, and data
  engineering groups, text/category filtering, shareable tip anchors, and
  global search over explanations and code. Entries are stored in typed
  content and pre-rendered. This personal interview reference is linked only
  from the footer, keeping it outside the main course navigation.

- **Inline concept definitions**: implemented across every topic. Curated
  lesson vocabulary targets around five core concepts per topic, capped
  at ten, with only the first body occurrence annotated.
  Titles, headings, and repeats stay
  plain. Terms use shared definitions and a theme-aware accent color.
  Hover, keyboard focus, or tap opens an in-page explanation;
  Escape or an outside click dismisses it. Tables, examples, and self-tests
  use the same definitions without changing code text.

- **Search / jump (cmd+k)**: implemented. `Cmd/Ctrl+K` or `/` opens a modal
  that filters query terms over topic titles, course titles, and descriptions,
  plus cheatsheet titles, explanations, and code. Arrow keys select a result;
  Enter opens the matching lesson or tip.
- **Deep-linkable anchors (P2)**: link directly to a section or a specific
  self-test question so a link can point
  at one question instead of "scroll down."
- **Previous / Next topic navigation**: implemented at the end of each
  lesson, following the topic order within its concept. Previous is omitted
  on the first topic, and Next is omitted on the last.
- **Worked examples**: replaced all 45 attachment prompts with small data
  tables or numbered step flows, reviewed from the last topic backward.
  Each includes a setup and takeaway, uses both themes, and appears before
  the self-test.
- **Local-only read progress**: implemented. Overall, per-course, and
  course-card meters use `localStorage`; opened topics have a "Read" label.
  There is no account or cross-device sync.
  Only the homepage overall progress bar shows a small, single-line
  theme-pink disclaimer underneath:
  "Clearing site data resets progress."
  Homepage and course-card bars remain visible at zero progress; the reset
  button appears once at least one topic has been opened.
- **Estimated reading time**: global progress, each concept tile, and
  concept pages show remaining and total time. Estimates use 200 words
  per minute, rounded up per topic, including written examples and
  self-tests/answers but excluding videos and practice time. Opened topics
  reduce remaining time using existing read markers; reset restores it.
  Progress uses native, accessible bars compatible with the production CSP.
- **Inline code formatting**: implemented. Any backtick-wrapped command or config key
  in prose (paragraphs, warnings, self-test, worked examples) renders as
  a styled inline code chip. Copy buttons and clipboard integration have
  been removed.
- **Keyboard navigation (P3)**: arrow keys or `j`/`k` to move between self-test
  questions, `esc` to go back a level.
- **Print / PDF view (P2)**: a print stylesheet so a topic page can be saved
  as a PDF before an interview, without animation artifacts.
  Full offline browsing is separate scope and is not implemented.
- **Related-topic cross-links (P2)**: a short "see also" list at the bottom of a
  detail page linking to topics that overlap (e.g. skew links to joins and
  partitioning).

## Security

- **Pre-publication security review (P0)**: scoped manual review completed
  for rendering, routing, browser storage, external resources, static-build
  logic, and CI. No confirmed exploitable vulnerability was identified.
  GitHub CodeQL passed and the owner reported no alerts. Complete hosting/public-content checks
  before launch; static hosting still has client-side and supply-chain risks.
- **Content Security Policy (implemented)**: generated pages include a
  restrictive meta policy before resources load, with an exact hash for the
  early theme script and same-origin scripts/styles/fonts/images. Inline
  handlers/styles, dynamic code evaluation, connections, forms, objects,
  and frames are blocked. Development HMR is unchanged. Meta policies cannot
  enforce `frame-ancestors`; host-level controls remain deployment checks.
- **Self-hosted fonts (implemented)**: Fraunces and Inter WOFF2 subsets and
  SIL Open Font licenses are bundled locally, preserving typography without
  Google Fonts requests.
- **Dependency hygiene (implemented, ongoing)**: local `npm audit` found
  zero advisories on 2026-11-20. CI and weekly Security runs audit all
  dependencies, failing on high/critical findings. Dependabot checks npm
  and Actions weekly. Review lower-severity findings and keep tooling patched.
- **Secret and code scans (implemented)**: checksum-pinned Gitleaks scans
  fetched Git history, working files, and fresh production output. Local
  scans found no secrets across 90 available commits and current files.
  CodeQL's JavaScript/TypeScript security-extended workflow passed on GitHub
  on 2026-11-20; the owner reported no alerts. Actions use immutable SHAs and
  least-privilege tokens.
- **Embedded SVGs**: review any future animation SVGs for embedded
  `<script>` tags before adding them to `public/assets/`, since inline SVG
  can execute script if not sanitized.
- **No secrets in the repo**: keep it that way; nothing here should ever need
  an API key or credential given the static, no-backend design.

## Deployment and productionizing

- **Static hosting (deployed)**: CI deploys the complete `dist/` only from
  `master`, after build/tests/audit and reusable Security jobs succeed for
  that commit. Pages' GitHub Actions source is enabled. The live site is
  `https://tarunrajnish.github.io/de-crash-course/`; HTTPS, direct pages,
  assets/fonts, CSP hashes, canonical URLs, and HTTP 404 behavior were
  verified on 2026-11-20.
- **HTTPS (P1) / custom domain (optional)**: verify HTTPS at launch.
  A later domain change requires DNS, Pages settings, and a rebuild with
  `VITE_SITE_URL` set to the final URL.
- **CI build check**: implemented and running on GitHub
  (`.github/workflows/ci.yml`), with `npm ci`, dependency audit,
  `tsc --noEmit`, `npm run build`, all tests, and reusable Security checks.
  Master pushes/manual CI runs can deploy after those checks pass; PRs
  and other branches cannot deploy.
- **Cache headers (host-dependent)**: Vite fingerprints asset filenames.
  GitHub Pages manages cache headers; custom header tuning is deferred
  unless a future host or proxy exposes that control.
- **SEO and direct URLs**: implemented. Static HTML is generated for every
  course and topic, with crawlable links, unique titles/descriptions,
  canonical and social metadata, a sitemap, and legacy hash-link redirects.
  `VITE_SITE_URL` configures the public domain and path prefix.
- **404 handling**: implemented as a dedicated, noindexed `404.html`.
  Known routes have their own HTML files; confirm the host serves the custom
  error page with HTTP 404 after deployment.
- **Versioned releases (P1, after initial deployment)**: tag releases in git once the site is deployed
  somewhere real, so a bad deploy can be rolled back by redeploying a
  previous tag.

## Analytics

- **Default: none.** Visitor analytics remain an explicit product/privacy
  decision. Google Search Console can provide search impressions and
  clicks without adding visitor-tracking scripts to the site.
- **If ever added, prefer privacy-respecting, aggregate-only tools**:
  self-hosted Plausible or Umami, or Cloudflare's free web analytics. No
  cookies, no cross-site identifiers, no personal data.
- **Local-only usage signal**: implemented as reading progress. It tells
  readers their own progress without sending it to the site owner.
- **If traffic metrics are ever wanted**, server/CDN access log counts
  (requests per path) are enough for "which topics get read" without adding
  any   client-side script at all, if the selected hosting provider exposes them.
  GitHub Pages does not provide repository owners with raw access logs.
