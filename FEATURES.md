# Feature list

Prioritized remaining work. Completed features are omitted. Listing a feature
does not authorize its implementation or infrastructure changes.

## Recommended order

| Priority | Work | Completion criterion |
| --- | --- | --- |
| P0: content review | Review public content | Finish reviewing material published on the live site |
| P0: release confidence | Browser regression coverage | Complete coverage for direct navigation, search, theme/progress persistence, reset, and mobile layouts |
| P0: testing cleanup | Disable temporary donation preview | Set `DONATION_TEST_MODE` to `false` and redeploy after popup testing is complete |
| P1: discovery | Search Console and sitemap submission | Verify the site in Google Search Console and submit the sitemap |
| P1: user feedback | Footer suggestion/correction box | Add in-site submission beyond the existing email link; confirm the delivery service before implementation |
| P1: release recovery | Versioned releases | Tag releases so a previous version can be redeployed for rollback |
| P2: learning navigation | Section/question anchors and related-topic links | Readers can share a specific section and discover connected concepts |
| P2: interview preparation | Print stylesheet and PDF output | Topics print with readable tables and an intentional policy for revealed answers, without navigation controls |
| P3: convenience | Additional keyboard navigation | Keyboard shortcuts complement standard links, tab navigation, and existing search shortcuts without interfering with text inputs |
| Optional | Custom domain | Configure a domain when chosen |
| Host-dependent | Custom cache headers | Tune headers only if a future host or proxy exposes that control |

## User experience

- **Footer suggestion/correction box (P1, planned)**: readers can write a
  suggestion or correction in the footer and submit it to the owner's email.
  The footer already links to `tarun.rajnish@gmail.com`. Include the page URL
  so a correction can be located. Confirm the delivery service before
  implementation: GitHub Pages cannot send
  email itself. A managed form service or serverless endpoint needs spam
  protection, clear submission/error states, and a narrowly scoped CSP update.
  Keep mail credentials outside the frontend and repository; confirm successful
  submission before showing a success message.

- **Donation preview cleanup (P0)**: the temporary public test mode shows a
  labeled support popup on every page load. Disable it after testing to use
  the implemented 25%, 50%, 75%, and 100% milestones.

- **Deep-linkable anchors (P2)**: link directly to a section or a specific
  self-test question so a link can point
  at one question instead of "scroll down."
- **Keyboard navigation (P3)**: arrow keys or `j`/`k` to move between self-test
  questions, `esc` to go back a level.
- **Print / PDF view (P2)**: a print stylesheet so a topic page can be saved
  as a PDF before an interview, without animation artifacts.
  Full offline browsing is separate scope and is not implemented.
- **Related-topic cross-links (P2)**: a short "see also" list at the bottom of a
  detail page linking to topics that overlap (e.g. skew links to joins and
  partitioning).

## Ongoing maintenance

- **Dependency and scanner updates**: review dependency advisories, CodeQL
  findings, and Dependabot updates; keep Actions and scanner versions current
  while preserving immutable pins and verified download checksums.
- **Embedded SVGs**: review any future animation SVGs for embedded
  `<script>` tags before adding them to `public/assets/`, since inline SVG
  can execute script if not sanitized.

## Deployment and productionizing

- **Search Console (P1)**: verify the site and submit
  `https://tarunrajnish.github.io/de-crash-course/sitemap.xml`.
- **Custom domain (optional)**: a domain change requires DNS, Pages settings,
  and a rebuild with
  `VITE_SITE_URL` set to the final URL.
- **Cache headers (host-dependent)**: custom header tuning is deferred
  unless a future host or proxy exposes that control.
- **Versioned releases (P1)**: tag releases so a bad deploy can be rolled
  back by redeploying a previous tag.
