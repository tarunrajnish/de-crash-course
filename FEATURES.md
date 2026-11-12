# Feature list

Ideas for improving the site, grouped by area. Nothing here is committed to;
this is a working backlog to pull from as the site grows past the first
topic set.

## User experience

- **Search / jump (cmd+k)**: fuzzy filter over topic titles once there are
  multiple topic sets, so a reader can jump straight to a topic instead of
  scrolling through a list.
- **Deep-linkable anchors**: link directly to a section or a specific
  self-test question (e.g. `#/topic/skew-and-salting#q3`) so a link can point
  at one question instead of "scroll down."
- **Local-only read progress**: a quiet "x of 10 topics opened" indicator
  stored in `localStorage`, shown as a dim checkmark on the topic list.
  Signals progress without a streak, badge, or server-side tracking.
- **Copy buttons** on code snippets and Spark UI evidence commands, since
  readers are often typing these into their own shell or notebook.
- **Keyboard navigation**: arrow keys or `j`/`k` to move between self-test
  questions, `esc` to go back a level.
- **Print / offline view**: a print stylesheet so a topic page can be saved
  as a PDF before an interview, without animation artifacts.
- **Related-topic cross-links**: a short "see also" list at the bottom of a
  detail page linking to topics that overlap (e.g. skew links to joins and
  partitioning).

## Security

- **No user input, no attack surface by default**: the site is fully static
  with no forms, no accounts, and no server-side code, so most common web
  vulnerabilities (injection, auth bypass, CSRF) do not apply as long as it
  stays that way.
- **Content Security Policy**: add a CSP header (via hosting config or a
  `<meta>` tag) restricting script/style sources to self, since the only
  external resources today are Google Fonts.
- **Subresource integrity**: pin Google Fonts or self-host them, so a
  compromised font CDN cannot inject script.
- **Dependency hygiene**: run `npm audit` periodically and keep Vite/
  TypeScript patched, since the dev server and build tooling are the actual
  attack surface, not the shipped site.
- **Embedded SVGs**: review any future animation SVGs for embedded
  `<script>` tags before adding them to `public/assets/`, since inline SVG
  can execute script if not sanitized.
- **No secrets in the repo**: keep it that way; nothing here should ever need
  an API key or credential given the static, no-backend design.

## Deployment and productionizing

- **Static hosting**: ship `npm run build`'s `dist/` output to a static host
  (GitHub Pages, Netlify, Vercel, Cloudflare Pages, or S3 plus CloudFront).
  No server process to manage.
- **Custom domain plus HTTPS**: any of the above providers handle TLS
  automatically; just point a domain at it.
- **CI build check**: a GitHub Actions workflow running `npm ci`,
  `tsc --noEmit`, and `npm run build` on every push, so a broken build never
  reaches the hosting provider.
- **Cache headers**: fingerprinted asset filenames from Vite's build already
  support long-lived caching; set `Cache-Control: public, max-age=31536000,
  immutable` on hashed assets and a short TTL on `index.html`.
- **404 handling**: configure the host to serve `index.html` for unknown
  paths, since routing is hash-based and should not need this, but worth
  confirming once a host is picked.
- **Versioned releases**: tag releases in git once the site is deployed
  somewhere real, so a bad deploy can be rolled back by redeploying a
  previous tag.

## Analytics

- **Default: none.** The homepage explicitly promises "no tracking
  dashboards," so any analytics addition should be weighed against that
  promise before being added.
- **If ever added, prefer privacy-respecting, aggregate-only tools**:
  self-hosted Plausible or Umami, or Cloudflare's free web analytics. No
  cookies, no cross-site identifiers, no personal data.
- **Local-only usage signal instead of server analytics**: reuse the
  "topics opened" `localStorage` idea from the UX list above. It tells the
  reader their own progress and tells nobody else anything.
- **If traffic metrics are ever wanted**, server/CDN access log counts
  (requests per path) are enough for "which topics get read" without adding
  any client-side script at all.
