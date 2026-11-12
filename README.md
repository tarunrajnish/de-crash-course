# Data Engineering Crash Course

A static, local reference site for Spark / Delta Lake / Structured Streaming
interview prep. Homepage tile grid, drill into a topic list, drill into a
detail page with taught content, embedded SVG animations where available,
video links, "examples to attach" callouts, and a click-to-reveal practice
section.

## Stack

Vite + vanilla TypeScript. No framework, no backend. All content lives as
typed data modules under `src/content/topics/`.

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
- `src/pages/*.ts`: home, topic list, and topic detail page renderers
- `src/style.css`: palette and layout (cream background, sage accent, muted
  red reserved for cost/gotcha callouts)
- `public/assets/*.svg`: the three embedded SMIL animations (narrow vs. wide,
  join strategies, skew and salting)

## Adding a topic

Add a new file under `src/content/topics/`, export a `Topic` object matching
the shape in `src/content/types.ts`, and add it to the `topics` array in
`src/content/index.ts`.
