# Data Engineering Crash Course

A static, local reference site for data engineering interview prep: Spark,
Delta Lake, and Structured Streaming fundamentals, plus data modeling,
orchestration, data quality, lakehouse storage, and AI × data engineering.
Homepage tile grid of topic sets, drill into a topic list, drill into a
detail page with taught content, embedded SVG animations where available,
video links, "examples to attach" callouts, and a click-to-reveal practice
section.

## Stack

Vite + vanilla TypeScript. No framework, no backend. All content lives as
typed data modules under `src/content/topics/`. Dark theme by default, with
a light/dark toggle persisted in `localStorage`.

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL (defaults to `http://localhost:5173/`).

## Project layout

- `src/content/types.ts`: shared content types (`Topic`, `Course`, etc.)
- `src/content/topics/*.ts`: one file per topic's taught content
- `src/content/index.ts`: assembles the course and topic lookups
- `src/lib/router.ts`: minimal hash-based router
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
