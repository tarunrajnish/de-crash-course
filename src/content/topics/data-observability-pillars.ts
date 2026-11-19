import type { Topic } from "../types";

export const dataObservabilityPillars: Topic = {
  id: "data-observability-pillars",
  glossary: ["Data observability", "Freshness", "Volume", "Schema", "Distribution", "Lineage"],
  title: "The pillars of data observability",
  shortDescription: "Why a green pipeline run and correct data are two different claims, and the five signals that tell them apart.",
  sections: [
    {
      heading: "\"It ran\" is not \"it's correct\"",
      paragraphs: [
        "A pipeline can exit with status zero, write a file to the expected path, and still produce garbage: a source API that silently returned zero rows, a join that fan-out duplicated every row, a currency field that started arriving as cents instead of dollars. None of these raise an exception. Orchestrator-level monitoring (did the DAG succeed, did the job finish within its SLA) answers a narrower question than the one stakeholders actually care about.",
        "Data observability is the practice of monitoring the data itself, not just the process that moved it. It borrows the shape of application observability (metrics, logs, traces) but the signals are different, because the failure mode isn't a crashed process, it's a dataset that is structurally or statistically wrong while every job that touched it reported success.",
      ],
    },
    {
      heading: "Freshness",
      paragraphs: [
        "Freshness asks: how old is the newest row, and is that normal for this table? A table that updates hourly going 18 hours without a new row is a freshness failure even if the last load that did run completed cleanly. The underlying cause is almost always upstream: a stalled source job, a paused connector, a silently expired credential.",
        "Freshness checks need a per-table expectation, not a global one. A slowly-changing dimension refreshed nightly and a clickstream table refreshed every five minutes have wildly different normal staleness, so a single global threshold either misses real incidents on the fast table or pages constantly on the slow one.",
      ],
    },
    {
      heading: "Volume",
      paragraphs: [
        "Volume tracks row counts (and sometimes byte counts) over time and flags deviations from the table's own history. A daily load that normally lands 2 to 3 million rows landing 40,000, or 40 million, is informative regardless of whether anyone knows why yet.",
        "Volume anomalies are usually the earliest and cheapest signal of an upstream break: a partial extract, a filter condition that silently changed, a duplicate load that ran twice. Catching it here, before the bad volume propagates into downstream aggregates, is strictly cheaper than catching it at the dashboard.",
      ],
    },
    {
      heading: "Schema",
      paragraphs: [
        "Schema monitoring tracks the structure of the data: columns added, removed, renamed, or retyped. An upstream service that silently changes a column from int to string, or renames user_id to userId, does not fail the pipeline if the transformation layer is loose about types; it just corrupts everything downstream that assumed the old shape.",
        "This is the pillar most directly connected to schema registries and contracts: observability detects drift after the fact, a contract prevents the incompatible change from shipping in the first place. Teams with mature observability still want both, because contracts only cover producers that agreed to the contract.",
      ],
    },
    {
      heading: "Distribution and lineage",
      paragraphs: [
        "Distribution (sometimes called \"quality\" more narrowly) checks statistical properties within columns: null rate, percentage of values matching an expected pattern, min/max/mean drift, cardinality of a supposedly low-cardinality column. A null rate on email jumping from 0.5% to 40% is a distribution failure that a schema check and a volume check both miss entirely, since the column still exists, is still the right type, and the row count is unchanged.",
        "Lineage is the map connecting all of the above: which upstream tables and jobs feed a given table or column, and which downstream tables consume it. Without lineage, every other pillar tells you something is wrong but not where to start fixing it; with it, an analyst who spots a bad number on a dashboard can walk backward to the exact job that produced it.",
      ],
      warning:
        "A team that only monitors job success rates will discover a six-month-old null-rate regression the same day a customer complains about it, not the day it started.",
    },
  ],
  videos: [{ title: "What is Data Observability?", url: "https://www.youtube.com/watch?v=Gg9SpB8rbqE" }],
  example: {
    title: "A successful run can still change the meaning of money",
    description: "An upstream producer switches from dollars to cents without changing the amount column's type.",
    table: {
      headers: ["Signal", "Yesterday", "Today"],
      rows: [
        ["Job result", "Succeeded", "Succeeded"],
        ["Row count", "10,000", "10,000"],
        ["Latest data ready", "06:05 UTC", "06:05 UTC"],
        ["Median amount", "25.00", "2,500.00"],
      ],
    },
    takeaway: "Execution, volume, and freshness look healthy. The 100x distribution shift reveals a semantic break; use lineage to find the producer change.",
  },
  selfTest: [
    {
      question: "Why is a successfully completed pipeline run not sufficient evidence that the data is correct?",
      answer:
        "A job can exit successfully while still producing wrong data: silently empty extracts, duplicated rows from a fan-out join, or a retyped column. Orchestrator success monitors whether the process ran, not whether the output is statistically or structurally sound.",
    },
    {
      question: "A table's row count drops from 3 million to 40,000 overnight with no error anywhere. Which observability pillar caught this, and what does it tell you?",
      answer:
        "Volume. It signals an upstream problem, most likely a partial extract or a changed filter condition, before the bad data reaches downstream aggregates where it would be far more expensive to detect and unwind.",
    },
    {
      question: "Why can't a single global freshness threshold work across all tables in a warehouse?",
      answer:
        "Tables have different natural refresh cadences. A single threshold either triggers false alarms on slowly-updating tables or misses real staleness incidents on fast-updating ones; each table needs its own expectation based on its own history.",
    },
    {
      question: "A column's null rate jumps from 0.5% to 40% but the schema, row count, and freshness are all unchanged. Which pillar detects this, and why do the others miss it?",
      answer:
        "Distribution. Schema monitoring only tracks structure (the column still exists with the same type), and volume only tracks row counts (unchanged), so neither pillar observes the statistical shift inside the column's values.",
    },
    {
      question: "How does lineage change the response to a data incident, compared to the other four pillars alone?",
      answer:
        "The other pillars detect that something is wrong in a specific table or column. Lineage maps the upstream and downstream dependencies of that table, letting an investigator walk backward from a bad dashboard number to the specific upstream job that caused it, instead of searching blind.",
    },
    {
      question: "What's the relationship between schema observability and a schema registry or contract?",
      answer:
        "A schema registry or contract prevents an incompatible schema change from being published in the first place. Schema observability detects drift after it has already happened, which matters for producers that aren't covered by a contract or that bypass it.",
    },
  ],
};
